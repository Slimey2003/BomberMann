import type { RoomSetting } from "@project/utils";

export type Room = {
    id: string;
    ownerId: string;
    players: { [key: string]: string };
    setting: RoomSetting;
}