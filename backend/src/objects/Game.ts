import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";
import BombController from "./moveable/BombController";
import EffectController from "./effect/EffectController";
import GameTickScheduler from "./GameTickScheduler";
import type Wall from "./wall/Wall";
import type Player from "./moveable/Player";
import type EffectCard from "./effect/EffectCard";
import type Bomb from "./moveable/Bombs";
import type ExplodeBomb from "./moveable/ExplodeBomb";
import type { BombDto, EffectDto, GameStateDto, PlayerDto, WallDto } from "@project/utils";
import BreakableWall from "./wall/BreakableWall";

export default class Game {
    private static blockProbability: number = 0.6;
    private static playerLives: number = 3;
    private static gameTickPerSec: number = 4;
    private static gameTime: number = 600_000;//10 Min

    private gameState: "config" | "running" | "ending" = "config";

    private gameTickScheduler: GameTickScheduler;
    private wallController: WallController;
    private playerController: PlayerController; 
    private bombController: BombController;
    private effectController: EffectController;

    constructor(playerNames: string[], height: number, width: number) {
        this.gameTickScheduler = new GameTickScheduler(Game.gameTickPerSec);
        this.wallController = new WallController(height, width, Game.blockProbability);
        this.playerController = new PlayerController(playerNames, Game.playerLives, height, width);
        this.bombController = new BombController();
        this.effectController = new EffectController();

        this.playerController.init(this.wallController, this.playerController, this.bombController, this.effectController);
        this.bombController.init(this.wallController, this.playerController, this.bombController, this.effectController);
        this.effectController.init(this.wallController, this.playerController, this.bombController, this.effectController);
    }

    static generateBasisGame() {
        return new Game(["Spieler1", "Spieler2"], 19, 15);
    }

    public getWallController() {
        return this.wallController;
    }

    public getPlayerController() {
        return this.playerController;
    }

    public getBombController() {
        return this.bombController;
    }

    public getEffectController() {
        return this.effectController;
    }

    public gameStart() {
        this.gameTickScheduler.start(this.tick);
        this.gameState = "running";
    }

    public isRunning(): boolean {
        return this.gameTickScheduler.isRunning()
    }

    public gameStop() {
        this.gameTickScheduler.stop();
    }


    public tick = (deltaTime: number, counter: number): void => {
        const pController = this.getPlayerController();
        const bController = this.getBombController();

        if (counter % 2 === 0) {
            pController.updateMovement();
            bController.playerCollidedWithBomb(false);
            bController.updateMovement();
        }

        if (counter % 4 === 0) {
            bController.triggerExplosion();
            bController.triggerExplodeTick();
            bController.triggerExplodeTimeDown();
        }
    };

    public gameOver() {
        if (Game.gameTime >= this.gameTickScheduler.getLastTime()
            && this.playerController.getPlayers().every(p => p.isDead())) {
            this.gameStop();
            this.gameState = "ending";
        }
    }

    public render(): GameStateDto {
        const walls: Map<string, Wall> = this.wallController.getWalls();
        const players: Player[] = this.playerController.getPlayers();
        const placedBombs: Bomb[] = this.bombController.getPlacedBombs();
        const explodeBombs: ExplodeBomb[] = this.bombController.getExplodeBombs();
        const effects: EffectCard[] = this.effectController.getEffectController().getEffects();

        const wallDtos: WallDto[] = [...walls.values()].map(w => {
            return {
                pos: w.getPosition(),
                breakable: w instanceof BreakableWall,
                box: w.getBox()
            };
        });

        const playerDtos: PlayerDto[] = players.map(p => {
            return {
                id: p.getId(),
                name: p.getName(),
                pos: p.getPosition(),
                box: p.getBox(),
                lives: p.getLives(),
                dead: p.isDead()
            }
        });

        const bombsDtos: BombDto[] = placedBombs.map(b => {
            return {
                id: b.getId(),
                pos: b.getPosition(),
                box: b.getBox(),
                explode: []
            }
        });
             
        bombsDtos.push(...
            explodeBombs.map(b => {
                return {
                    id: b.getBomb().getId(),
                    pos: b.getBomb().getPosition(),
                    box: b.getBomb().getBox(),
                    explode: b.getCalculatedRange()
                }
            })
        )

        const effectDtos: EffectDto[] = effects.map(e => {
            return {
                pos: e.getPosition(),
                effect: e.getEffectId(),
                box: e.getBox()
            }
        });

        return {
            type: this.gameState,
            gameTime: Game.gameTime,
            timeLeft: this.gameTickScheduler.getLastTime(),
            players: playerDtos,
            bombs: bombsDtos,
            walls: wallDtos,
            effects: effectDtos
        }
    }
    
}