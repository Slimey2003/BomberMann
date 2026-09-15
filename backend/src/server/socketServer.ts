import { Server, Socket } from "socket.io";
import type { GameStateDto, RoomSetting } from "@project/utils";
import GameManager from "../bomberman/GameManager";
import http from "http";
import type { Room } from "../utils/util";
import { ro } from "zod/locales";

interface ClientToServerEvents {
    state_room: (callback: (state: boolean) => void) => void;

    is_admin: (callback: (isAdmin: boolean, settings?: RoomSetting) => void) => void;
    create_room: (playerName: string, roomSize: number, callback: (roomId: string) => void) => void;
    close_room: () => void;
    start_game: () => void;

    update_difficulty: (diff: number, callback: (settings: RoomSetting) => void) => void;
    update_game_time: (time: number, callback: (settings: RoomSetting) => void) => void
    update_field_size: (size: number, callback: (settings: RoomSetting) => void) => void

    join_room: (roomId: string, playerName: string, callback: (success: boolean, isAdmin?: boolean, setting?: RoomSetting) => void) => void;
    leave_room: () => void;
    request_players: (callback: (players: string[]) => void) => void;
    
    update_player_name: (name: string) => void;
    player_add_action: (input: string) => void;
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
}

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export default class SocketServer {
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private gameManager: GameManager;

    constructor(server: http.Server, gameManager: GameManager) {
        this.gameManager = gameManager;
        this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
            cors: { 
                origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
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
    }

    private initEvents(): void {
        this.io.on("connection", (socket: GameSocket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: GameSocket): void {
        socket.on("state_room", (callback) => {
            const roomId: string | null = socket.data.roomId;
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
        
        socket.on("create_room", (playerName: string, roomSize: number, callback) => {
            const roomInfo = this.gameManager.createRoom(socket.id, playerName, roomSize);
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
                callback(false);
                return;
            }
            if (room.ownerId == socket.id) {
                this.gameManager.updatePlayerName(roomId, socket.id, playerName);
            
                this.io.to(roomId).emit("room_players", Object.values(room.players));
                callback(true, true, room.setting);
                return;
            }
            const players = this.gameManager.addPlayer(roomId, socket.id, playerName);

            this.joinSocketToRoom(socket, roomId);
            this.io.to(roomId).emit("room_players", Object.values(players));
            callback(true);
        });
        
        socket.on("leave_room", () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const players = this.gameManager.removePlayer(roomId, socket.id);
            socket.data.roomId = null;
            this.io.to(roomId).emit("room_players", Object.values(players)); 
        });
        
        socket.on("request_players", (callback) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const room = this.gameManager.getRoom(roomId);
            if (room == undefined) return;
            callback(Object.values(room.players));
        });
        
        socket.on("update_player_name", (name) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;
            const room = this.gameManager.getRoom(roomId);
            if (room == undefined) return;
            this.gameManager.updatePlayerName(roomId, socket.id, name);
            this.io.to(roomId).emit("room_players", Object.values(room.players)); 
        });

        socket.on("player_add_action", (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.addInputPlayerKey(socket.id, input);
        });

        socket.on("player_release_action", (input: string) => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.releaseInputPlayerKey(socket.id, input);
        });
        
        socket.on("player_clear_action", () => {
            const roomId = socket.data.roomId;
            if (!roomId) return;

            const room = this.gameManager.getRoom(roomId);
            if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
            const playerController = room.activeGame.getPlayerController();
            playerController.clearPlayerKeys(socket.id);
        });
        
        socket.on("disconnect", () => {
            this.handleDisconnect(socket);
        });
    }

    private isRoomAdmin(socket: GameSocket): Room | undefined {
        const roomId: string | null = socket.data.roomId;
        if (!roomId) return undefined;
        const room: Room | undefined = this.gameManager.getRoom(roomId);
        if (room == undefined || room.ownerId != socket.id) {
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
    
    private handleDisconnect(socket: GameSocket): void {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        this.gameManager.removePlayer(roomId, socket.id);
    }

    private startBroadcastLoop(): void {
        setInterval(() => {
            const activeSocketRooms = this.io.sockets.adapter.rooms;
            
            for (const [roomId, _] of activeSocketRooms) {
                const room = this.gameManager.getRoom(roomId);
                
                if (room && room.activeGame && room.activeGame.isRunning()) {
                    const state: GameStateDto = room.activeGame.render();
                    this.io.to(roomId).emit("game_tick", state);
                }
            }
        }, 50);
    }
}