import { Server, Socket } from "socket.io";
import type { GameStateDto } from "@project/utils";
import GameManager from "../bomberman/GameManager";

interface ClientToServerEvents {
    create_room: (playerName: string, roomSize: number, callback: (roomId: string) => void) => void;
    join_room: (roomId: string, playerName: string, callback: (success: boolean) => void) => void;
    start_game: (roomId: string) => void;
    player_action: (input: string) => void;
}

interface ServerToClientEvents {
    game_tick: (state: GameStateDto) => void;
    room_players: (player: string[]) => void;
    error: (msg: string) => void;
}

interface InterServerEvents {}

interface SocketData {
    roomId: string | null;
}

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export default class SocketServer {
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private gameManager: GameManager;

    constructor(port: number, gameManager: GameManager) {
        this.gameManager = gameManager;
        this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(port, {
            cors: { origin: "*" }
        });

        this.initMiddleware();
        this.initEvents();
        this.startBroadcastLoop();
    }

    private initMiddleware(): void {
        this.io.use((socket: GameSocket, next) => {
            socket.data = {
                roomId: null
            };
            next();
        });
    }

    private initEvents(): void {
        this.io.on("connection", (socket: GameSocket) => {
            socket.on("create_room", (playerName: string, roomSize: number, callback) => {
                const roomInfo = this.gameManager.createRoom(socket.id, playerName, roomSize);
                
                this.joinSocketToRoom(socket, roomInfo.id);
                callback(roomInfo.id);
            });

            socket.on("join_room", (roomId: string, playerName: string, callback) => {
                const players = this.gameManager.addPlayer(roomId, socket.id, playerName);

                this.joinSocketToRoom(socket, roomId);
                this.io.to(roomId).emit("room_players", Object.values(players));
                callback(true);
            });

            socket.on("start_game", (roomId: string) => {
                this.gameManager.startGame(roomId);
            });

            socket.on("player_action", (input: string) => {
                const roomId = socket.data.roomId;
                if (!roomId) return;

                const room = this.gameManager.getRoom(roomId);
                if (!room || !room.activeGame || !room.activeGame.isRunning()) return;
                const playerController = room.activeGame.getPlayerController();
                playerController.addInputPlayerKey(socket.id, input);
            });
            
            socket.on("disconnect", () => {
                this.handleDisconnect(socket);
            });
        });
    }

    private joinSocketToRoom(socket: GameSocket, roomId: string): void {
        socket.data.roomId = roomId;
        socket.join(roomId);
        
    }
    
    private handleDisconnect(socket: GameSocket): void {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        this.gameManager.removePlayer(roomId, socket.id);
        socket.leave(roomId);
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