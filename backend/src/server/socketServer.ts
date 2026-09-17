import { Server, Socket } from "socket.io";
import type { GameStateDto, RoomSetting } from "@project/utils";
import GameManager from "../bomberman/GameManager";
import http from "http";
import type { Room } from "../utils/util";

interface ClientToServerEvents {
    state_room: (roomId: string, callback: (state: boolean) => void) => void;
    is_admin: (callback: (isAdmin: boolean, settings?: RoomSetting) => void) => void;
    
    //Room
    reconnect_room: (roomId: string, callback: (success: boolean, players: string[], isAdmin: boolean, settings?: RoomSetting) => void) => void;
    create_room: (playerName: string, roomSize: number, callback: (roomId: string) => void) => void;
    close_room: () => void;
    join_room: (roomId: string, playerName: string, callback: (success: boolean, msg?: string) => void) => void;
    leave_room: () => void;
    request_players: (callback: (players: string[]) => void) => void;

    //Room Setting
    update_difficulty: (diff: number, callback: (settings: RoomSetting) => void) => void;
    update_game_time: (time: number, callback: (settings: RoomSetting) => void) => void
    update_field_size: (size: number, callback: (settings: RoomSetting) => void) => void

    //Game
    start_game: () => void;
    delete_game: () => void;

    //Player Update (Game / Room)
    update_player_name: (name: string) => void;
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
    sessionId: string | null;
}

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export default class SocketServer {
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private gameManager: GameManager;
    private disconnectTimeouts: Map<string, NodeJS.Timeout>;

    constructor(server: http.Server, gameManager: GameManager) {
        this.gameManager = gameManager;
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

    private initMiddleware(): void {
        this.io.use((socket: GameSocket, next) => {
            const sessionId = socket.handshake.auth.sessionId;
            if (!sessionId) {
                return next(new Error("Fehlende Session ID"));
            }
            socket.data.sessionId = sessionId;
            next();
        });
    }

    private initEvents(): void {
        this.io.on("connection", (socket: GameSocket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: GameSocket): void {
        socket.on("state_room", (roomId, callback) => {
            if (!roomId) {
                callback(false);
                return;
            }
            const room: Room | undefined = this.gameManager.getRoom(roomId);
            callback(room != undefined);
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
            const roomInfo = this.gameManager.createRoom(this.getUserId(socket), playerName, roomSize);
            this.joinSocketToRoom(socket, roomInfo.id);
            callback(roomInfo.id);
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
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateDifficulty(room.id, diff);
            callback(room.setting);
        });
        
        socket.on("update_game_time", (time: number, callback) => {
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateGameTime(room.id, time)
            callback(room.setting);
        });
        
        socket.on("update_field_size", (size: number, callback) => {
            const room = this.isRoomAdmin(socket);
            if (room == undefined) {
                return;
            }
            this.gameManager.updateCanvasSize(room.id, size)
            callback(room.setting);
        });

        socket.on("join_room", (roomId: string, playerName: string, callback) => {
            if (!this.roomValidation(socket, roomId)) return;
            if (!this.nameValidation(socket, playerName)) return;
            const room = this.gameManager.getRoom(roomId);
            if (!room) {
                callback(false, "Der Raum existiert nicht!");
                return;
            }
            const userId = this.getUserId(socket);
            const playersList = this.getPlayerListAsArray(room.players);
            if (playersList.length >= room.setting.roomSize) {
                callback(false, "Der Raum ist voll!");
                return;
            }
            if (playersList.find(name => name === playerName)) {
                callback(false, "Der Name wurde bereits vergeben!");
                return;
            }
            const players = this.gameManager.addPlayer(roomId, userId, playerName);

            this.joinSocketToRoom(socket, roomId);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(players));
            callback(true);
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
        
        socket.on("update_player_name", (name) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const room = this.gameManager.getRoom(roomId);
            if (room == undefined) return;
            this.gameManager.updatePlayerName(roomId, this.getUserId(socket), name);
            this.io.to(roomId).emit("room_players", this.getPlayerListAsArray(room.players)); 
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

    private getUserId(socket: Socket): string {
        return socket.data.sessionId;
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
        if (!roomId.match("^[a-z0-9_]{7,7}$")) {
            socket.emit("error", "Raum ID ungültig! (7 Zeichen, a-z, 0-9, _)");
            return false;
        }
        return true;
    }

    private nameValidation(socket: GameSocket, name: string): boolean {
        if (!name.match("^[a-zA-Z0-9_]{3,10}$")) {
            socket.emit("error", "Spielername ungültig! (3-10 Zeichen, A-Z, 0-9, _)");
            return false;
        }
        return true;
    }

    private getPlayerListAsArray(players: {[key: string]: string}): string[] {
        return Object.values(players);
    }

    private handleDisconnect(socket: GameSocket): void {
        const roomId = socket.data.roomId;
        const sessionId = socket.data.sessionId;
        
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