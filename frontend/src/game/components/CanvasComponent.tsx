import type { GameStateDto } from "@project/utils";
import { useEffect, useRef } from "react";
import Vector from "@project/utils/Vector";
import Direction from "@project/utils/Direction";
import { drawExplosionBeam } from "../util/Utils";
import ImageController from "../util/ImageController";

export default function Canvas({gameState, width, height}: {gameState: GameStateDto | null, width: number, height: number}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const imageControllerRef = useRef<ImageController | null>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        ctxRef.current = canvas.getContext("2d");
        if (!ctxRef.current) return;
        imageControllerRef.current = new ImageController(ctxRef.current);
    }, []);

    useEffect(() => {
        if (!ctxRef.current || !imageControllerRef.current || !gameState) return;
        
        ctxRef.current.clearRect(0, 0, width, height);
        render(gameState, ctxRef.current, imageControllerRef.current, width, height);
    }, [gameState]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ border: "2px solid #333" }}
        />
    );
}

function render(gameState: GameStateDto, ctx: CanvasRenderingContext2D, imageController: ImageController, width: number, height: number) {
    imageController.drawBackground(width, height);

    for (const wall of gameState.walls) {
        let imageName = "wall/solidWall";
        if (wall.breakable && wall.resistance !== undefined) {
            const currentDamage = wall.damage || 0;
            let remainingResistance = Math.max(0, wall.resistance - currentDamage);
            if (remainingResistance === 1) remainingResistance = 0;
            imageName = "wall/breakableWall_" + remainingResistance;
        }
        imageController.drawImage(imageName, wall.box);
    }

    for (const player of gameState.players) {
        imageController.drawImage("player/player_" + player.id, player.box);
    }

    for (const effect of gameState.effects) {
        imageController.drawImage("effect/effect_" + effect.id, effect.box);
    }

    
    for (const bomb of gameState.bombs) {
        for (const vec of bomb.explode) {
            if (!vec.equals(Vector.nullVector)) {
                const dir = Direction.fromVector(bomb.pos, vec);
                let img: HTMLImageElement | undefined = imageController.getImage("explosion/explosion_center");
                if (!img) return;
                switch (dir) {
                    case Direction.NORTH:
                    case Direction.SOUTH:
                        img = imageController.getImage("explosion/explosion_up_down");
                        break;
                    case Direction.EAST:
                    case Direction.WEST:
                        img = imageController.getImage("explosion/explosion_right_left");
                        break;
                }
                drawExplosionBeam(ctx, img, vec, bomb.pos.getX(), bomb.pos.getY(), bomb.box.getWidth());
            }
        }
    }
    for (const bomb of gameState.bombs) {
        if (!bomb.explode || bomb.explode.length === 0) {
            imageController.drawImage("bomb/bomb", bomb.box);
            continue;
        }
        imageController.drawImage("explosion/explosion_center", bomb.box);
    }
            
}