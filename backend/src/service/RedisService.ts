import { createClient } from "redis";
import type { PlayerInput, Room } from "../utils/util";
import type { GameStateDto, RoomSetting } from "@project/utils";

export default class RedisService {
    private pubClient: ReturnType<typeof createClient>;
    private subClient: ReturnType<typeof createClient>;

    constructor() {
        this.pubClient = createClient({url: "redis://localhost:6379"});
        this.subClient = this.pubClient.duplicate();
    }

    public async connect() {
         await this.pubClient.connect();
         await this.subClient.connect();
    }

    public async shutdown() {
         await this.pubClient.quit();
         await this.subClient.quit();
    }

    public async createRoom(room: Room) {
        await this.pubClient.hSet(`room:${room.id}`, {
            ownerId: room.ownerId,
            setting: JSON.stringify(room.setting),
        });
        await this.pubClient.sAdd(`room:${room.id}:players`, room.ownerId); //User Name Fehlt.....
    }

    public async roomExists(roomId: string): Promise<boolean> {
        return await this.pubClient.exists(`room:${roomId}`) !== 0;
    }

    public async getRoom(roomId: string): Promise<Room | null> {
        if (await this.roomExists(roomId)) return null;
        const roomData = await this.pubClient.get(`room:${roomId}`);
        if (!roomData) return null;
        return JSON.parse(roomData);
    }

    public async getRoomSettings(roomId: string): Promise<RoomSetting | null> {
        const settingData = await this.pubClient.hGet(`room:${roomId}`, `setting`);
        if (!settingData) return null;
        return JSON.parse(settingData);
    }

    public async updateRoomSettings(roomId: string, settings: RoomSetting) {
        await this.pubClient.hSet(`room:${roomId}`, {
            setting: JSON.stringify(settings),
        });
    }

    public async deleteRoom(roomId: string) {
        await this.pubClient.del([`room:${roomId}`, `room:${roomId}:players`]);
    }

    public async addPlayerToRoom(roomId: string, playerId: string) {
        const roomExists = await this.pubClient.exists(`room:${roomId}`);
        if (!roomExists) {
            throw Error(`Der Raum:${roomId} existiert nicht`);
        }
        await this.pubClient.sAdd(`room:${roomId}:players`, playerId);
    }

    public async removePlayerFromRoom(roomId: string, playerId: string) {
        const roomExists = await this.pubClient.exists(`room:${roomId}`);
        if (!roomExists) {
            throw Error(`Der Raum:${roomId} existiert nicht`);
        }
        await this.pubClient.sRem(`room:${roomId}:players`, playerId);
    }

    public async getPlayersInRoom(roomId: string): Promise<string[]> {
        return await this.pubClient.sMembers(`room:${roomId}:players`);
    }

    public async publishPlayerInput(roomId: string, playerId: string, input: PlayerInput) {
        const channel = `room:${roomId}:input`;
        await this.pubClient.publish(channel, JSON.stringify({
            id: playerId,
            input: input
        }));
    }

    public async subscribeToInputs(roomId: string, onInputReceived: (playerId: string, input: PlayerInput) => void): Promise<void> {
        const channel = `room:${roomId}:input`;
        await this.subClient.subscribe(channel, (m, _c) => {
            const inputData = JSON.parse(m);
            onInputReceived(inputData.id, inputData.input);
        });
    }

    public async unsubscribeFromInputs(roomId: string): Promise<void> {
        const channel = `room:${roomId}:input`;
        await this.subClient.unsubscribe(channel);
    }

    public async publishGameState(roomId: string, gameState: GameStateDto): Promise<void> {
        const channel = `room:${roomId}:state`;
        await this.pubClient.publish(channel, JSON.stringify(gameState));
    }

    public async subscribeToGameState(roomId: string, onStateReceived: (gameState: GameStateDto) => void): Promise<void> {
        const channel = `room:${roomId}:state`;
        await this.subClient.subscribe(channel, (m, _c) => {
            const stateData = JSON.parse(m);
            onStateReceived(stateData);
        });
    }

    public async unsubscribeFromGameState(roomId: string): Promise<void> {
        const channel = `room:${roomId}:state`;
        await this.subClient.unsubscribe(channel);
    }
}