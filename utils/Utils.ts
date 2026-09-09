import type BoundingBox from "./BoundingBox";
import type Vector from "./Vector";

export function getRandomInt(min: number, max: number) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new RangeError('Both min and max must be integers.');
    }
    if (min > max) {
        throw new RangeError('min must be less than or equal to max.');
    }

    // Generate random integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const EffectType = {
    SPEED: 0,
    STRANGE: 1,
    RANGE: 2,
    STACK: 3,
};

export type Canvas = {
    height: number;
    width: number;
    wallSize: number;
    playerSize: number;
    bombSize: number;
    effectSize: number;
}

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
    resistance?: number,
    damage?: number,
    eff?: number | undefined
};

export type EffectDto = {
    pos: Vector;
    effect: number;
    box: BoundingBox;
};