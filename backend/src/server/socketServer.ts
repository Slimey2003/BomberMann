import { Server, Socket } from "socket.io";
import type { GameStateDto, RoomSetting } from "@project/utils";
import GameManager from "../bomberman/GameManager";
import http from "http";
import type { Room } from "../utils/util";
import type KeycloakAuth from "../auth/KeycloakAuth";
import type { JwtPayload } from "jsonwebtoken";
import type { UUID } from "crypto";
import RateLimiter from "../service/RateLimiter";
import MESSAGES, {REGEX} from "@project/utils/message";

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
    private gameManager: GameManager;
    private disconnectTimeouts: Map<string, NodeJS.Timeout>;
    private authService: KeycloakAuth;
    private rateLimiter: RateLimiter;

    constructor(server: http.Server, authService: KeycloakAuth, gameManager: GameManager) {
        this.authService = authService;
        this.gameManager = gameManager;
        this.rateLimiter = new RateLimiter(10_000, 10, 60_000); //innerhalb von 10 Sek maximal 10 Anfragen, alle 60 Sek wird auf geräumt. 
        this.disconnectTimeouts = new Map();
        const origins = process.env.FRONTEND_URL 
            ? process.env.FRONTEND_URL.split(",") 
            : ["http://127.0.0.1:5173", "http://localhost:5173"];

        this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
            cors: {
                origin: origins,
                methods: ["GET", "POST"],
                credentials: true
            }
        });
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
            console.log(decodedUser);
            socket.data.userId = decodedUser ? decodedUser["sub"] : undefined;
            socket.data.user = decodedUser;
            next();
        } catch (error) {
            console.log(error);
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
        socket.on("state_room", (roomId, callback) => {
            if (this.isRateLimited(socket)) {
                callback(false, true);
                return;
            }
            if (!roomId) {
                callback(false, false);
                return;
            }
            const room: Room | undefined = this.gameManager.getRoom(roomId);
            callback(room != undefined, false);
        });
        
        socket.on("is_admin", (callback) => {
            const room = this.isRoomAdmin(socket);
            callback(room != undefined, room?.setting);
        });

        socket.on("reconnect_room", (roomId: string, callback) => {
            if (roomId === null) {
                callback(false, [], false);
                return;
            }
            if (this.isRateLimited(socket)) return;
            const room: Room | undefined = this.gameManager.getRoom(roomId);
            if (room === undefined || !room.players[this.getUserId(socket)]) {
                socket.data.roomId = null;
                callback(false, [], false);
                return;
            }

            socket.data.roomId = roomId;
            socket.join(roomId);

            const playerList = this.getPlayerListAsArray(room.players);
            if (room.ownerId === this.getUserId(socket)) {
                callback(true, playerList, true, room.setting);
                return;
            }
            callback(true, playerList, false);
        }) 
        
        socket.on("create_room", (playerName: string, roomSize: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback("", true);
                return;
            }
            const roomInfo = this.gameManager.createRoom(this.getUserId(socket), playerName, roomSize);
            this.joinSocketToRoom(socket, roomInfo.id);
            callback(roomInfo.id, false);
        });
        
        socket.on("close_room", () => {
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.deleteRoom(room.id);
            this.io.to(room.id).emit("closed_room"); 
        });
        
        socket.on("start_game", () => {
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.startGame(room.id);
        });

        socket.on("delete_game", () => {
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.deleteGame(room.id);
        });

        socket.on("update_difficulty", (diff: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateDifficulty(room.id, diff);
            callback(room.setting, false);
        });
        
        socket.on("update_game_time", (time: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateGameTime(room.id, time)
            callback(room.setting, false);
        });
        
        socket.on("update_field_size", (size: number, callback) => {
            if (this.isRateLimited(socket)) {
                callback({gameTime: 0, difficulty: 0, canvasSize: 0, roomSize: 0}, true);
                return;
            }
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateCanvasSize(room.id, size)
            callback(room.setting, false);
        });

        socket.on("join_room", (roomId: string, playerName: string, callback) => {
            if (this.isRateLimited(socket)) {
                callback(false, true);
                return;
            }
            if (!this.roomValidation(socket, roomId)) return;
            if (!this.nameValidation(socket, playerName)) return;
            const room = this.gameManager.getRoom(roomId);
            if (!room) {
                callback(false, false, "Der Raum existiert nicht!");
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
            const players = this.gameManager.addPlayer(roomId, userId, playerName);

            this.joinSocketToRoom(socket, roomId);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(players));
            callback(true, false);
        });
        
        socket.on("leave_room", () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const players = this.gameManager.removePlayer(roomId, this.getUserId(socket));
            socket.leave(roomId);
            socket.data.roomId = null;
            
            const playersList = this.getPlayerListAsArray(players);
            if (playersList.length === 0) {
                this.io.to(roomId).emit("closed_room");
                return;
            }
            this.io.to(roomId).emit("room_players", playersList);
        });
        
        socket.on("request_players", (callback) => {
            const id = socket.data.roomId;
            if (!id) return;
            const room = this.gameManager.getRoom(id);
            if (room == undefined) return;
            callback(this.getPlayerListAsArray(room.players));
        });
        
        socket.on("update_player_name", (playerName, callback) => {
            if (this.isRateLimited(socket)) {
                callback(true);
                return;
            }
            const roomId = socket.data.roomId;
            if (!roomId) return;
            if (!this.roomValidation(socket, roomId)) return;
            if (!this.nameValidation(socket, playerName)) return;
            const room = this.gameManager.getRoom(roomId);
            if (!room) {
                callback(false, "Der Raum existiert nicht!");
                return;
            }
            const playersList = this.getPlayerListAsArray(room.players);
            if (playersList.find(name => name === playerName)) {
                callback(false, "Der Name wurde bereits vergeben!");
                return;
            }
            this.gameManager.updatePlayerName(roomId, this.getUserId(socket), playerName);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(room.players));
            callback(false);
        });

        socket.on("player_input_action", (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.addInputPlayerKey(this.getUserId(socket), input);
        });

        socket.on("player_release_action", (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.releaseInputPlayerKey(this.getUserId(socket), input);
        });
        
        socket.on("player_clear_action", () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.clearPlayerKeys(this.getUserId(socket));
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

    private isRoomAdmin(socket: GameSocket): Room | undefined {
        const roomId: string | null = socket.data.roomId;
        if (!roomId) return undefined;
        const room: Room | undefined = this.gameManager.getRoom(roomId);
        if (room == undefined || room.ownerId != this.getUserId(socket)) {
            return undefined;
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
        const sessionId = socket.data.userId;
        
        if (!roomId || !sessionId) return;
        
        const timeout = setTimeout(() => {
            const players = this.gameManager.removePlayer(roomId, socket.id);
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
        setInterval(() => {
            const activeSocketRooms = this.io.sockets.adapter.rooms;
            
            for (const [roomId, _] of activeSocketRooms) {
                const room = this.gameManager.getRoom(roomId);
                if (room && room.activeGame) {
                    const state: GameStateDto = room.activeGame.render();
                    this.io.to(roomId).emit("game_tick", state);
                }
            }
        }, 50);
    }
}