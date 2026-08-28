import type BoundingBox from "./BoundingBox";
import type Vector from "./Vector";
export const EffectType = {
    SPEED: 0,
    STRANGE: 1,
    RANGE: 2,
};

export type GameStateDto = {
    type: "config" | "running" | "ending";
    gameTime: number;
    timeLeft: number;
    players: PlayerDto[];
    bombs: BombDto[];
    walls: WallDto[];
    effects: EffectDto[];
};

export type PlayerDto = {
    id: number;
    name: string;
    pos: Vector;
    box: BoundingBox;
    lives: number;
    dead: boolean;
};

export type BombDto = {
    id: string;
    pos: Vector;
    box: BoundingBox;
    explode: Vector[];
};

export type WallDto = {
    pos: Vector;
    breakable: boolean;
    box: BoundingBox;
};

export type EffectDto = {
    pos: Vector;
    effect: number;
    box: BoundingBox;
};