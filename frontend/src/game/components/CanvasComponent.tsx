import type { GameStateDto } from "@project/utils";
import { useEffect, useRef, useMemo } from "react";
import Game from "../backend/objects/Game";
import PlayerInputController from "../backend/objects/PlayerInputController";
import Vector from "@project/utils/Vector";
import Direction from "@project/utils/Direction";
import { drawExplosionBeam } from "../util/Utils";
import ImageController from "../util/ImageController";

let imageController: ImageController | undefined;

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const game = useMemo(() => Game.generateBasisGame(), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const logicalWidth = 975;
        const logicalHeight = 975;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        imageController = new ImageController(ctx);
        const inputController = new PlayerInputController(0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.key) return;
            e.preventDefault();
            if (e.key === " ") {
                game?.getBombController().placeBomb(0);
            }
            inputController.addKey(e.key);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.key) return;
            inputController.removeKey(e.key);
        };

        const handleClick = () => {
            inputController.clearKeys();
        };

        window.addEventListener("click", handleClick);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        game?.gameStart();

        let animationFrameId: number;

        const loop = () => {
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            game?.getPlayerController().setPlayerVelocity(0, inputController.getLastDirection());
            
            const state = game?.render();
            if (state) {
                render(state, ctx, logicalWidth, logicalHeight);
            }
            
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("click", handleClick);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, [game]);

    return (
        <div style={{ justifyContent: "center" }}>
            <h1>Hello World</h1>
            <canvas
                ref={canvasRef}
                width={975}
                height={975}
                style={{ border: "2px solid #333" }}
            />
        </div>
    );
}

function render(gameState: GameStateDto, ctx: CanvasRenderingContext2D, width: number, height: number) {
    imageController?.drawBackground(width, height);

    for (const wall of gameState.walls) {
        let imageName = "wall/solidWall";
        if (wall.breakable && wall.resistance !== undefined) {
            const currentDamage = wall.damage || 0;
            let remainingResistance = Math.max(0, wall.resistance - currentDamage);
            if (remainingResistance === 1) remainingResistance = 0;
            imageName = "wall/breakableWall_" + remainingResistance;
        }
        imageController?.drawImage(imageName, wall.box);
    }

    for (const player of gameState.players) {
        imageController?.drawImage("player/player_" + player.id, player.box);
    }

    for (const effect of gameState.effects) {
        imageController?.drawImage("effect/effect_" + effect.id, effect.box);
    }

    for (const bomb of gameState.bombs) {
        if (!bomb.explode || bomb.explode.length === 0) {
            imageController?.drawImage("bomb/bomb", bomb.box);
            continue;
        }
        imageController?.drawImage("explosion/explosion_center", bomb.box);
        for (const vec of bomb.explode) {
            if (!vec.equals(Vector.nullVector)) {
                const dir = Direction.fromVector(bomb.pos, vec);
                let img: HTMLImageElement | undefined = imageController?.getImage("explosion/explosion_center");
                if (!img) return;
                switch (dir) {
                    case Direction.NORTH:
                    case Direction.SOUTH:
                        img = imageController?.getImage("explosion/explosion_up_down");
                        break;
                    case Direction.EAST:
                    case Direction.WEST:
                        img = imageController?.getImage("explosion/explosion_right_left");
                        break;
                }
                drawExplosionBeam(ctx, img, vec, bomb.pos.getX(), bomb.pos.getY(), bomb.box.getWidth());
            }
        }
    }
}