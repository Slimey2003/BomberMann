import { createClient, type RedisArgument } from "redis";
import type { Room } from "../utils/util";

export default class RedisService {
    private pubClient: ReturnType<typeof createClient>;
    private subClient: ReturnType<typeof createClient>;

    constructor() {
        this.pubClient = createClient({url: "redis://localhost:6379"});
        this.subClient = this.pubClient.duplicate();
    }

    public async init() {
        await this.pubClient.connect();
        await this.subClient.connect();
        this.sub();
    }

    public sub() {
        
    }

    public registerRoom(room: Room) {

    }

    public getRoom(roomId: string) {

    }

    public async getGlobalRooms(): Promise<Record<string, Room>> {
        const rooms: Record<string, Room> = {};
        let cursor: RedisArgument = "";
        
        do {
            const result = await this.subClient.scan(cursor, { MATCH: "room:*", COUNT: 100 });
            cursor = result.cursor;
            
            for (const key of result.keys) {
                const data = await this.subClient.get(key);
                if (data) {
                    const roomId = key.split(":")[1];
                    rooms[roomId] = JSON.parse(data);
                }
            }
        } while (cursor !== "");

        return rooms;
    }
}