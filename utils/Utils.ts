import BoundingBox from "./BoundingBox";
import Vector from "./Vector";
import { z } from "zod";

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

export function formatMilliseconds(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.max(0, Math.floor(totalSeconds / 60));
    const seconds = Math.max(0, totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const EffectType = {
    SPEED: {id: 0, step: 0.075, defaultVal: 1.075, maxLevel: 3},
    STRANGE: {id: 1, step: 1, defaultVal: 1, maxLevel: 3},
    RANGE: {id: 2, step: 1, defaultVal: 1, maxLevel: 3},
    STACK: {id: 3, step: 1, defaultVal: 1, maxLevel: 3},
};

export function getEffectTypes(): {id: number, maxLevel: number}[] {
    return [EffectType.SPEED, EffectType.STACK, EffectType.STRANGE, EffectType.RANGE];
}

export const VectorSchema = z.object({
    x: z.number(),
    y: z.number()
}).transform((val) => new Vector(val.x, val.y));

export type VectorType = z.infer<typeof VectorSchema>;

export const BoundingBoxSchema = z.object({
    minX: z.number(),
    minY: z.number(),
    maxX: z.number(),
    maxY: z.number()
}).transform((val) => {
    const width = val.maxX - val.minX;
    const height = val.maxY - val.minY;
    const centerX = val.minX + (width / 2);
    const centerY = val.minY + (height / 2);
    return new BoundingBox(new Vector(centerX, centerY), height, width);
});

export type BoundingBoxType = z.infer<typeof BoundingBoxSchema>;

export const CanvasSchema = z.object({
    height: z.number(),
    width: z.number(),
    wallSize: z.number(),
    playerSize: z.number(),
    bombSize: z.number(),
    effectSize: z.number()
});
export type Canvas = z.infer<typeof CanvasSchema>;

export const RoomSchema = z.object({
    id: z.number(),
    players: z.object()
});

export const RoomSettingSchema = z.object({
    gameTime: z.number(),
    difficulty: z.number(),
    canvasSize: z.number(),
    roomSize: z.number()
});
export type RoomSetting = z.infer<typeof RoomSettingSchema>;

export const GameSettingSchema = z.object({
    gameTime: z.number(),
    playerMaxLive: z.number(),
    canvas: CanvasSchema,
    blockProbability: z.number()
});
export type GameSetting = z.infer<typeof GameSettingSchema>;

export const EffectDtoSchema = z.object({
    id: z.number(),
    level: z.number(),
    max: z.number()
});
export type EffectDto = z.infer<typeof EffectDtoSchema>;

export const PlayerDtoSchema = z.object({
    id: z.string(),
    name: z.string(),
    pos: VectorSchema,
    box: BoundingBoxSchema,
    effects: z.array(EffectDtoSchema),
    lives: z.number(),
    dead: z.boolean()
});
export type PlayerDto = z.infer<typeof PlayerDtoSchema>;

export const BombDtoSchema = z.object({
    id: z.string(),
    pos: VectorSchema,
    box: BoundingBoxSchema,
    explode: z.array(VectorSchema)
});
export type BombDto = z.infer<typeof BombDtoSchema>;

export const WallDtoSchema = z.object({
    pos: VectorSchema,
    breakable: z.boolean(),
    box: BoundingBoxSchema,
    resistance: z.number().optional(),
    damage: z.number().optional()
});
export type WallDto = z.infer<typeof WallDtoSchema>;

export const EffectCardDtoSchema = z.object({
    id: z.number(),
    pos: VectorSchema,
    box: BoundingBoxSchema
});
export type EffectCardDto = z.infer<typeof EffectCardDtoSchema>;



export const GameStateDtoSchema = z.object({
    roomId: z.string(),
    type: z.enum(["loading", "running", "ending"]),
    setting: GameSettingSchema,
    timeLeft: z.number(),
    players: z.array(PlayerDtoSchema),
    bombs: z.array(BombDtoSchema),
    walls: z.array(WallDtoSchema),
    effects: z.array(EffectCardDtoSchema),
    pickedEffectCount: z.number(),
    bombPlaceCount: z.number(),
    maxEffects: z.number(),
    wallBreakableCount: z.number(),
    wallBreaksCount: z.number()
});
export type GameStateDto = z.infer<typeof GameStateDtoSchema>;