import type { GameStateDto, RoomSetting } from "@project/utils";
import Game from "./objects/Game";
import type { PlayerInput, Room } from "../utils/util";
import type RedisService from "../service/RedisService";
import GameController from "./GameController";

export default class RoomManager {
    private redisService: RedisService;
    private gameController: GameController;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
        this.gameController = new GameController();
    }

    public async getRoom(roomId: string): Promise<Room | null> {
        return await this.redisService.getRoom(roomId);
    }

    public getGame(roomId: string): Game | undefined {
        return this.gameController.getGame(roomId);
    }

    public async publishGameState(roomId: string, state: GameStateDto) {
        await this.redisService.publishGameState(roomId, state);
    }

    public async createRoom(hostId: string, playerName: string, roomSize: number): Promise<Room> {
        const roomID = Math.random().toString(36).substring(2, 9);
        const roomSetting: RoomSetting = {
            roomSize: roomSize,
            gameTime: 600_000,
            canvasSize: 0,
            difficulty: 2,
        };
        
        const room: Room = {
            id: roomID,
            ownerId: hostId,
            players: {},
            setting: roomSetting,
        };
        
        await this.redisService.createRoom(room, hostId, playerName);
        return room;
    }

    public async deleteRoom(roomId: string) {
        await this.redisService.deleteRoom(roomId);
        await this.redisService.unsubscribeFromInputsAdd(roomId);
        await this.redisService.unsubscribeFromInputsRelease(roomId);
        await this.redisService.unsubscribeFromInputsClear(roomId);
        await this.redisService.unsubscribeFromGameState(roomId);
    }

    public async updatePlayerName(roomId: string, playerId: string, name: string): Promise<{[key: string]: string}> {
        const isExistRoom: boolean = await this.redisService.roomExists(roomId);
        if (!isExistRoom) return {};
        await this.redisService.addPlayerToRoom(roomId, playerId, name);
        return this.redisService.getPlayersInRoom(roomId);
    }

    public async updateDifficulty(roomId: string, diff: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.difficulty = diff;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }

    public async updateCanvasSize(roomId: string, size: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.canvasSize = size;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }
    
    public async updateGameTime(roomId: string, time: number): Promise<Room | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        room.setting.gameTime = time;
        await this.redisService.updateRoomSettings(roomId, room.setting);
        return room;
    }

    public async getSetting(roomId: string): Promise<RoomSetting | null> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return null;
        return room.setting;
    }

    public async addPlayer(roomId: string, playerId: string, name: string): Promise<{ [key: string]: string }> {
        const isExistRoom: boolean = await this.redisService.roomExists(roomId);
        if (!isExistRoom) return {};
        await this.redisService.addPlayerToRoom(roomId, playerId, name);
        const players = await this.redisService.getPlayersInRoom(roomId);
        return players;
    }

    public async removePlayer(roomId: string, playerId: string): Promise<{ [key: string]: string }> {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return {};
        if (room.ownerId === playerId) {
            await this.deleteRoom(roomId);
            return {}
        }
        await this.redisService.removePlayerFromRoom(roomId, playerId);
        
        const game: Game | undefined = this.gameController.getGame(roomId);
        if (game) {
            game.getPlayerController().removePlayer(playerId);
        }
        const players = await this.redisService.getPlayersInRoom(roomId);
        return players;
    }

    public async addInputPlayer(roomId: string, playerId: string, input: PlayerInput) {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return;

        const game: Game | undefined = this.gameController.getGame(roomId);
        if (!game) {
            await this.redisService.publishPlayerInputAdd(roomId, playerId, input);
            return;
        }
        game.getPlayerController().addInputPlayerKey(playerId, input);
    }

    public async releaseInputPlayer(roomId: string, playerId: string, input: PlayerInput) {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return;

        const game: Game | undefined = this.gameController.getGame(roomId);
        if (!game) {
            await this.redisService.publishPlayerInputRelease(roomId, playerId, input);
            return;
        }
        game.getPlayerController().releaseInputPlayerKey(playerId, input);
    }

    public async clearInputPlayer(roomId: string, playerId: string) {
        const room: Room | null = await this.getRoom(roomId);
        if (!room) return;

        const game: Game | undefined = this.gameController.getGame(roomId);
        if (!game) {
            await this.redisService.publishPlayerInputClear(roomId, playerId);
            return;
        }
        game.getPlayerController().clearPlayerKeys(playerId);
    }

    public async startGame(roomId: string): Promise<Game | null> {
        const room: Room | null = await this.redisService.getRoom(roomId);
        if (!room) return null; 
        const game: Game = this.gameController.createGame(room);
        
        await this.redisService.subscribeToInputsAdd(roomId, (playerId, input) => {
            game.getPlayerController().addInputPlayerKey(playerId, input);
        });

        await this.redisService.subscribeToInputsRelease(roomId, (playerId, input) => {
            game.getPlayerController().releaseInputPlayerKey(playerId, input);
        });

        await this.redisService.subscribeToInputsClear(roomId, (playerId) => {
            game.getPlayerController().clearPlayerKeys(playerId);
        });
        
        return game;
    }

    public async deleteGame(roomId: string){
        this.gameController.deleteGame(roomId);
        this.redisService.unsubscribeFromInputsAdd(roomId);
        this.redisService.unsubscribeFromInputsRelease(roomId);
        this.redisService.unsubscribeFromInputsClear(roomId);
        
        this.redisService.unsubscribeFromGameState(roomId);
    }

    public subscribeToGameState(roomId: string, onStateReceived: (gameState: GameStateDto) => void) {
        this.redisService.subscribeToGameState(roomId, onStateReceived);
    }


    unsubscribeFromGameState(roomId: string) {
        this.redisService.unsubscribeFromGameState(roomId);
    }
}