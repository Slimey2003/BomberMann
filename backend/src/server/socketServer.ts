import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { GameStateDto, RoomSetting } from "@project/utils";
import RoomManager from "../bomberman/RoomManager";
import http from "http";
import type { Room } from "../utils/util";
import type KeycloakAuth from "../auth/KeycloakAuth";
import type { JwtPayload } from "jsonwebtoken";
import type { UUID } from "crypto";
import RateLimiter from "../service/RateLimiter";
import MESSAGES, {REGEX} from "@project/utils/message";
import type Game from "../bomberman/objects/Game";

interface ClientToServerEvents {
    state_room: (roomId: string, callback: (state: boolean, isRateLimited: boolean) => void) => void;
    is_admin: (callback: (isAdmin: boolean, settings?: RoomSetting) => void) => void;
    
    //Room
    reconnect_room: (roomId: string, callback: (success: boolean, players: string[], isAdmin: boolean, settings?: RoomSetting) => void) => void;
    create_room: (playerName: string, roomSize: number, callback: (roomId: string, isRateLimited: boolean) => void) => void;
    close_room: () => void;
    join_room: (roomId: string, playerName: string, callback: (success: boolean, isRateLimited: boolean, msg?: string) => void) => void;
    leave_room: () => void;
    request_players: (callback: (players: string[]) => void) => void;

    //Room Setting
    update_difficulty: (diff: number, callback: (settings: RoomSetting, isRateLimited: boolean) => void) => void;
    update_game_time: (time: number, callback: (settings: RoomSetting, isRateLimited: boolean) => void) => void
    update_field_size: (size: number, callback: (settings: RoomSetting, isRateLimited: boolean) => void) => void

    //Game
    start_game: () => void;
    delete_game: () => void;

    //Player Update (Game / Room)
    update_player_name: (name: string, callback: (isRateLimited: boolean, msg?: string) => void) => void;
    player_input_action: (input: string) => void;
    player_release_action: (input: string) => void;
    player_clear_action: () => void;
}

interface ServerToClientEvents {
    game_tick: (state: GameStateDto) => void;
    room_players: (player: string[]) => void;
    closed_room: () => void;
    error: (msg: string, roomID?: string, isJoining?: boolean) => void;
}

interface InterServerEvents {}

interface SocketData {
    roomId: string | null;
    userId: UUID | undefined;
    user: string | JwtPayload | undefined;
}

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export default class SocketServer {
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private roomManager: RoomManager;
    private disconnectTimeouts: Map<string, NodeJS.Timeout>;
    private authService: KeycloakAuth;
    private rateLimiter: RateLimiter;

    constructor(server: http.Server, authService: KeycloakAuth, roomManager: RoomManager) {
        this.authService = authService;
        this.roomManager = roomManager;
        this.rateLimiter = new RateLimiter(10_000, 10, 60_000); //innerhalb von 10 Sek maximal 10 Anfragen, alle 60 Sek wird auf geräumt. 
        this.disconnectTimeouts = new Map();

        this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        this.io.adapter(createAdapter(this.roomManager.getPubClient(), this.roomManager.getSubClient()));
    }

    public start(): void {
        this.initMiddleware();
        this.initEvents();
        this.startBroadcastLoop();
    }
    
    private authenticateSocket = async (socket: Socket, next: (error?: Error) => void) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            console.log("Error no Token!");
            return next(new Error('Authentication error'));
        }

        try {
            const decodedUser = await this.authService.verifyToken(token);
            if (!decodedUser) {
                console.log("Error no DecodedUser")
                next(new Error('Authentication error'));
                return;
            }
            socket.data.userId = decodedUser ? decodedUser["sub"] : undefined;
            socket.data.user = decodedUser;
            console.log(socket.data.userId);
            next();
        } catch (error) {
            console.log("Fehler bei Auth:", error);
            return next(new Error('Authentication error'));
        }
    }

    private initMiddleware(): void {
        this.io.use(this.authenticateSocket);
    }

    private initEvents(): void {
        this.io.on("connection", (socket: GameSocket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: GameSocket): void {
        socket.on("state_room", async (roomId, callback) => {
            if (this.isRateLimited(socket)) {
                callback(false, true);
                return;
            }
            if (!roomId) {
                callback(false, false);
                return;
            }
            const room: Room | null = await this.roomManager.getRoom(roomId);
            callback(room != null, false);
        });
        
        socket.on("is_admin", async (callback) => {
            const room = await this.isRoomAdmin(socket);
            callback(room != null, room?.setting);
        });

        socket.on("reconnect_room", async (roomId: string, callback) => {
            if (roomId === null) {
                callback(false, [], false);
                return;
            }
            if (this.isRateLimited(socket)) return;
            const room: Room | null = await this.roomManager.getRoom(roomId);
            if (room === null|| !room.players[this.getUserId(socket)]) {
                socket.data.roomId = null;
                callback(false, [], false);
                return;
            }

            socket.data.roomId = roomId;
            socket.join(roomId);
            const timeoutId = this.disconnectTimeouts.get(this.getUserId(socket));
            clearTimeout(timeoutId);
            const playerList = this.getPlayerListAsArray(room.players);
            if (room.ownerId === this.getUserId(socket)) {
                callback(true, playerList, true, room.setting);
                return;
            }
            callback(true, playerList, false);
        }) 
        
        socket.on("create_room", async (playerName: string, roomSize: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback("", true);
                return;
            }
            const roomInfo = await this.roomManager.createRoom(this.getUserId(socket), playerName, roomSize);
            this.joinSocketToRoom(socket, roomInfo.id);
            callback(roomInfo.id, false);
        });
        
        socket.on("close_room", async () => {
            const room = await this.isRoomAdmin(socket);
            if (room == null) {
                return;
            }
            await this.roomManager.deleteRoom(room.id);
            this.io.to(room.id).emit("closed_room"); 
        });
        
        socket.on("start_game", async () => {
            const room = await this.isRoomAdmin(socket);
            if (room == null) {
                return;
            }
            await this.roomManager.startGame(room.id);
        });

        socket.on("delete_game", async () => {
            const room = await this.isRoomAdmin(socket);
            if (room == null) {
                return;
            }
            this.roomManager.deleteGame(room.id);
        });

        socket.on("update_difficulty", async (diff: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            let room = await this.isRoomAdmin(socket);
            if (room == null) return;
            room = await this.roomManager.updateDifficulty(room.id, diff);
            if (room == null) return;
            callback(room.setting, false);
        });
        
        socket.on("update_game_time", async (time: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            let room = await this.isRoomAdmin(socket);
            if (room == null) return;
            room = await this.roomManager.updateGameTime(room.id, time)
            if (room == null) return;
            callback(room.setting, false);
        });
        
        socket.on("update_field_size", async (size: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            let room = await this.isRoomAdmin(socket);
            if (room == null) return;
            room = await this.roomManager.updateCanvasSize(room.id, size)
            if (room == null) return;
            callback(room.setting, false);
        });

        socket.on("join_room", async (roomId: string, playerName: string, callback) => {
            if (this.isRateLimited(socket)) {
                callback(false, true);
                return;
            }
            if (!this.roomValidation(socket, roomId)) return;
            if (!this.nameValidation(socket, playerName)) return;
            const room = await this.roomManager.getRoom(roomId);
            if (!room) {
                callback(false, false, MESSAGES.ROOM_INVALID);
                return;
            }
            const userId = this.getUserId(socket);
            const playersList = this.getPlayerListAsArray(room.players);
            if (playersList.length >= room.setting.roomSize) {
                callback(false, false, "Der Raum ist voll!");
                return;
            }
            if (playersList.find(name => name === playerName)) {
                callback(false, false, "Der Name wurde bereits vergeben!");
                return;
            }
            const players = await this.roomManager.addPlayer(roomId, userId, playerName);

            this.joinSocketToRoom(socket, roomId);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(players));
            callback(true, false);
        });
        
        socket.on("leave_room", async () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const players = await this.roomManager.removePlayer(roomId, this.getUserId(socket));
            socket.leave(roomId);
            socket.data.roomId = null;
            
            const playersList = this.getPlayerListAsArray(players);
            if (playersList.length === 0) {
                this.io.to(roomId).emit("closed_room");
                return;
            }
            this.io.to(roomId).emit("room_players", playersList);
        });
        
        socket.on("request_players", async (callback) => {
            const id = socket.data.roomId;
            if (!id) return;
            const room = await this.roomManager.getRoom(id);
            if (room == null) return;
            callback(this.getPlayerListAsArray(room.players));
        });
        
        socket.on("update_player_name", async (playerName, callback) => {
            if (this.isRateLimited(socket)) {
                callback(true);
                return;
            }
            const roomId = socket.data.roomId;
            if (!roomId) return;
            if (!this.roomValidation(socket, roomId)) return;
            if (!this.nameValidation(socket, playerName)) return;
            const room = await this.roomManager.getRoom(roomId);
            if (!room) {
                callback(false, MESSAGES.ROOM_INVALID);
                return;
            }
            const playersList = this.getPlayerListAsArray(room.players);
            if (playersList.find(name => name === playerName)) {
                callback(false, MESSAGES.ROOM_PLAYER_NAME_USED);
                return;
            }

            const newList = await this.roomManager.updatePlayerName(roomId, this.getUserId(socket), playerName);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(newList));
            callback(false);
        });

        socket.on("player_input_action", async (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            await this.roomManager.addInputPlayer(roomId, this.getUserId(socket), input);
        });

        socket.on("player_release_action", async (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            await this.roomManager.releaseInputPlayer(roomId, this.getUserId(socket), input);
        });
        
        socket.on("player_clear_action", async () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            await this.roomManager.clearInputPlayer(roomId, this.getUserId(socket));
        });
        
        socket.on("disconnect", () => {
            this.handleDisconnect(socket);
        });
    }

    private isRateLimited(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
        return this.rateLimiter.isLimited(socket.data.userId);
    }

    private getUserId(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): string {
        return socket.data.userId ?? "";
    }

    private async isRoomAdmin(socket: GameSocket): Promise<Room | null> {
        const roomId: string | null = socket.data.roomId;
        if (!roomId) return null;
        const room: Room | null = await this.roomManager.getRoom(roomId);
        if (room == null || room.ownerId != this.getUserId(socket)) {
            return null;
        }
        return room;
    }

    private joinSocketToRoom(socket: GameSocket, roomId: string): void {
        socket.data.roomId = roomId;
        socket.join(roomId);
    }

    private roomValidation(socket: GameSocket, roomId: string): boolean {
        if (!roomId.match(REGEX.ROOM_ID)) {
            socket.emit("error", MESSAGES.ROOM_ID_INVALID);
            return false;
        }
        return true;
    }

    private nameValidation(socket: GameSocket, name: string): boolean {
        if (!name.match(REGEX.PLAYER_NAME)) {
            socket.emit("error", MESSAGES.ROOM_PLAYER_NAME_INVALID);
            return false;
        }
        return true;
    }

    private getPlayerListAsArray(players: {[key: string]: string}): string[] {
        return Object.values(players);
    }

    private handleDisconnect(socket: GameSocket): void {
        const roomId = socket.data.roomId;
        const sessionId = this.getUserId(socket);
        
        if (!roomId || !sessionId) return;

        const timeout = setTimeout(async () => {
            const players = await this.roomManager.removePlayer(roomId, sessionId);
            const playerList = this.getPlayerListAsArray(players);
            if (playerList.length === 0) {
                this.io.to(roomId).emit("closed_room");
            } else {
                this.io.to(roomId).emit("room_players", playerList);
            }
            this.disconnectTimeouts.delete(sessionId);
        }, 30000);

        this.disconnectTimeouts.set(sessionId, timeout);
    }

    private startBroadcastLoop(): void {
        setInterval(async () => {
            const activeSocketRooms = this.io.sockets.adapter.rooms;
            for (const [roomId, _] of activeSocketRooms) {
                const game: Game | undefined = this.roomManager.getGame(roomId);
                if (game) {
                    const state: GameStateDto = game.render();
                    this.io.to(roomId).emit("game_tick", state);
                }
            }
        }, 50);
    }
}