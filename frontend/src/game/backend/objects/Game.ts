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
import type { BombDto, Canvas, EffectDto, GameSetting, GameStateDto, PlayerDto, WallDto } from "@project/utils";
import BreakableWall from "./wall/BreakableWall";

export default class Game {
    private static gameTickPerSec: number = 20;

    private gameState: "config" | "running" | "ending" = "config";
    private setting: GameSetting;

    private gameTickScheduler: GameTickScheduler;
    private wallController: WallController;
    private playerController: PlayerController; 
    private bombController: BombController;
    private effectController: EffectController;

    constructor(playerNames: string[], setting: GameSetting) {
        this.setting = setting;
        this.gameTickScheduler = new GameTickScheduler(Game.gameTickPerSec);
        this.wallController = new WallController(this.setting.canvas, this.setting.blockProbability);
        this.playerController = new PlayerController(playerNames, this.setting.playerMaxLive, this.setting.canvas);
        this.bombController = new BombController(this.setting.canvas);
        this.effectController = new EffectController(this.setting.canvas);

        this.playerController.init(this.wallController, this.playerController, this.bombController, this.effectController);
        this.bombController.init(this.wallController, this.playerController, this.bombController, this.effectController);
        this.effectController.init(this.wallController, this.playerController, this.bombController, this.effectController);
    }

    static generateBasisGame(): Game {
        return new Game(["Spieler1"], {
            gameTime: 600_000,
            playerMaxLive: 3,
            roomSize: 3,
            blockProbability: 0.6,
            canvas: {
                height: 520,
                width: 520,
                playerSize: 40, //30 klein 40 groß
                wallSize: 40, //30 klein 40 groß
                bombSize: 30, // 20 klein 30 groß
                effectSize: 35 // 27.5 ddd klein 35 groß
            },
        });
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
        if (this.gameOver()) return;

        const pController = this.getPlayerController();
        const bController = this.getBombController();

        pController.updateMovement();
        bController.updateMovement();
        bController.playerCollidedWithBomb();

        if (counter % 4 === 0) {
            bController.triggerExplosion();
            bController.triggerExplodeTick();
            bController.triggerExplodeTimeDown();
        }
    };

    public gameOver() {
        if ((this.gameTickScheduler.getStartTime() + this.setting.gameTime) - this.gameTickScheduler.getLastTime() <= 0
            || this.playerController.getPlayers().every(p => p.isDead())) {
            this.gameStop();
            this.gameState = "ending";
            return true;
        }
        return false;
    }

    public render(): GameStateDto {
        const walls: Map<string, Wall> = this.wallController.getWalls();
        const players: Player[] = this.playerController.getPlayers();
        const placedBombs: Bomb[] = this.bombController.getPlacedBombs();
        const explodeBombs: ExplodeBomb[] = this.bombController.getExplodeBombs();
        const effects: EffectCard[] = this.effectController.getEffectCards();

        const wallDtos: WallDto[] = [...walls.values()].map(w => {
            if (w instanceof BreakableWall) {
                return {
                    pos: w.getPosition(),
                    breakable: true,
                    resistance: w.getResistance(),
                    damage: w.getDamage(),
                    box: w.getBox(), 
                    eff: w.getEffect()
                }
            }
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
                id: e.getEffectId(),
                pos: e.getPosition(),
                box: e.getBox()
            }
        });
        return {
            type: this.gameState,
            setting: this.setting,
            timeLeft: (this.gameTickScheduler.getStartTime() + this.setting.gameTime) - this.gameTickScheduler.getLastTime(),
            players: playerDtos,
            bombs: bombsDtos,
            walls: wallDtos,
            effects: effectDtos,
            pickedEffectCount: this.getEffectController().getPickedEffectCount(),
            bombPlaceCount: this.getBombController().getPlaceCount(),
            maxEffects: this.getEffectController().getMaxEffectsCards(),
        }
    }
    
}