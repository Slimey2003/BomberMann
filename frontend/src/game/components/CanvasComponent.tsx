import type { GameStateDto } from "@project/utils";
import { useEffect, useRef } from "react";
import Game from "../backend/objects/Game";
import Direction from "@project/utils/Direction";
import PlayerInputController from "../backend/objects/PlayerInputController";

const imageCache: {[key: string]: HTMLImageElement} = {};
let backgroundPatternCache: CanvasPattern | null = null;

function getImage(name: string): HTMLImageElement {
    if (imageCache[name]) {
        return imageCache[name];
    }
    const img = new Image();
    img.src = "/svg/" + name + ".svg";
    imageCache[name] = img;
    return img;
}


export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const game: Game | null = Game.generateBasisGame();
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const logicalWidth = 975;
        const logicalHeight = 975;
        
        const ctx = canvas.getContext("2d");
        if (ctx == null) return;

        const inputController = new PlayerInputController(0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.key) return;
            if (e.key === " ") {
                e.preventDefault();
                game.getBombController().placeBomb(0);
            }
            e.preventDefault();
            inputController.addKey(e.key);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.key) return;
            inputController.removeKey(e.key);
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        game.gameStart();

        let animationFrameId: number;

        const loop = () => {
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            game.getPlayerController().setPlayerVelocity(0, inputController.getLastDirection());
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
                    width={975}
                    height={975}
                    style={{ border: "2px solid #333" }} 
                />
            </div>
        </>
    );
}


function render(gameState: GameStateDto, ctx: CanvasRenderingContext2D, width: number, height: number) {
    const bgImg = getImage("background");
    
    if (bgImg.complete && bgImg.naturalHeight !== 0) {
        if (!backgroundPatternCache) {
            backgroundPatternCache = ctx.createPattern(bgImg, 'repeat');
        }
        if (backgroundPatternCache) {
            ctx.fillStyle = backgroundPatternCache;
            ctx.fillRect(0, 0, width, height);
        }
    }

    for (const wall of gameState.walls) {
        let imageName = "soildWall";
        if (wall.breakable && wall.resistance !== undefined) {
            const currentDamage = wall.damage || 0;
            let remainingResistance = Math.max(0, wall.resistance - currentDamage);
            if (remainingResistance === 1) remainingResistance = 0; 
            imageName = "breakableWall_" + remainingResistance;
        }

        const wallImg = getImage(imageName);
        
        if (wallImg.complete && wallImg.naturalHeight !== 0) {
            ctx.drawImage(
                wallImg,
                Math.round(wall.box.getMinX()),
                Math.round(wall.box.getMinY()),
                Math.round(wall.box.getWidth()),
                Math.round(wall.box.getHeight())
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
    
    for (const bomb of gameState.bombs) {
        if (!bomb.explode || bomb.explode.length === 0) {
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
        } else {
            const explImg = getImage("explosion");
            if (explImg.complete && explImg.naturalHeight !== 0) {
                
                const size = bomb.box.getWidth();
                const halfSize = size / 2;
                const startX = bomb.pos.getX();
                const startY = bomb.pos.getY();

                ctx.drawImage(
                    explImg,
                    Math.round(startX - halfSize),
                    Math.round(startY - halfSize),
                    Math.round(size),
                    Math.round(size)
                );

                for (const vec of bomb.explode) {
                    if (vec.getX() === 0 && vec.getY() === 0) {
                        continue;
                    }

                    const diffX = vec.getX() - startX;
                    const diffY = vec.getY() - startY;

                    let drawX = 0;
                    let drawY = 0;
                    let drawW = size;
                    let drawH = size;

                    if (diffX > 0) {
                        drawX = startX + halfSize;
                        drawY = startY - halfSize;
                        drawW = diffX;
                        drawH = size;
                    } else if (diffX < 0) {
                        drawX = vec.getX() - halfSize;
                        drawY = startY - halfSize;
                        drawW = Math.abs(diffX);
                        drawH = size;
                    } else if (diffY > 0) {
                        drawX = startX - halfSize;
                        drawY = startY + halfSize;
                        drawW = size;
                        drawH = diffY;
                    } else if (diffY < 0) {
                        drawX = startX - halfSize;
                        drawY = vec.getY() - halfSize;
                        drawW = size;
                        drawH = Math.abs(diffY);
                    }

                    if (drawW > 0 && drawH > 0) {
                        ctx.drawImage(
                            explImg,
                            Math.round(drawX),
                            Math.round(drawY),
                            Math.round(drawW),
                            Math.round(drawH)
                        );
                    }
                }
            }
        }
    }
}