import type { RoomSetting } from "@project/utils";
import type Game from "../bomberman/objects/Game";

export type Room = {
    id: string;
    ownerId: string;
    players: { [key: string]: string };
    setting: RoomSetting;
    activeGame?: Game;
}