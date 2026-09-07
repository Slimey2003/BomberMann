import type { GameStateDto } from "@project/utils";
import { useEffect, useRef } from "react";
import Game from "../backend/objects/Game";
import Direction from "@project/utils/Direction";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const game: Game | null = Game.generateBasisGame();
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const logicalWidth = 975;
        const logicalHeight = 975;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        
        canvas.style.width = logicalWidth + "px";
        canvas.style.height = logicalHeight + "px";
        
        const ctx = canvas.getContext("2d");
        if (ctx == null) return;
        
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.key) {
                return;
            }
            const dir: Direction = Direction.fromKey(e.key);
            if (dir === Direction.NONE) {
                if (e.key === " ") {
                    e.preventDefault();
                    game.getBombController().placeBomb(0);
                }
                return;
            }
            e.preventDefault();
            game.getPlayerController().setPlayerVelocity(0, dir);
        };

        const handleKeyUp = () => {
            game.getPlayerController().setPlayerVelocity(0, Direction.NONE);
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        game.gameStart();

        let animationFrameId: number;

        const loop = () => {
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            render(game.render(), ctx, logicalWidth, logicalHeight);
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div style={{justifyContent: "center"}}>
                <h1>Hello World</h1>
                <canvas 
                    ref={canvasRef}
                    width={750}
                    height={750}
                    style={{ border: "2px solid #333" }} 
                />
            </div>
        </>
    );
}


function render(gameState: GameStateDto, ctx: CanvasRenderingContext2D, width: number, height: number) {
    const bgImg = getImage("background");
    
    if (bgImg.complete && bgImg.naturalHeight !== 0) {
        const pattern = ctx.createPattern(bgImg, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
        }
    }

    for (const wall of gameState.walls) {
        const wallImg = getImage(wall.breakable ? "breakableWall" : "soildWall");
        if (wallImg.complete && wallImg.naturalHeight !== 0) {
            ctx.drawImage(
                wallImg,
                wall.box.getMinX(),
                wall.box.getMinY(),
                wall.box.getWidth(),
                wall.box.getHeight()
            );
        }
    }
    
    for (const player of gameState.players) {
        const playerImg = getImage("spieler_0" + player.id);
        if (playerImg.complete && playerImg.naturalHeight !== 0) {
            ctx.drawImage(
                playerImg,
                player.box.getMinX(),
                player.box.getMinY(),
                player.box.getWidth(),
                player.box.getHeight()
            );
        }
    }
    
    for (const bomb of gameState.bombs) {
        const bombImg = getImage("bomb");
        if (bombImg.complete && bombImg.naturalHeight !== 0) {
            ctx.drawImage(
                bombImg,
                bomb.box.getMinX(),
                bomb.box.getMinY(),
                bomb.box.getWidth(),
                bomb.box.getHeight()
            );
        }
    }
    
    for (const effect of gameState.effects) {
        const effectImg = getImage("effect_0" + effect.effect);
        if (effectImg.complete && effectImg.naturalHeight !== 0) {
            ctx.drawImage(
                effectImg,
                effect.box.getMinX(),
                effect.box.getMinY(),
                effect.box.getWidth(),
                effect.box.getHeight()
            );
        }
    }
}

function getImage(name: string): HTMLImageElement {
    const img = new Image();
    img.src = "/svg/" + name + ".svg";
    return img;
}