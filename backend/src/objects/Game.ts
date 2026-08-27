import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";
import BombController from "./moveable/BombController";
import EffectController from "./effect/EffectController";
import GameTickScheduler from "./GameTickScheduler";

export default class Game {
    private static blockProbability: number = 0.6;
    private static playerLives: number = 3;
    private static gameTickPerSec: number = 4;


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
    }

    public gameStop() {
        this.gameTickScheduler.stop();
    }


    public tick(deltaTime: number, counter: number): void {
        const pController = this.getPlayerController();
        const bController = this.getBombController();
        if (counter % 2 === 0) {
            pController.updateMovement();
            bController.playerCollidedWithBomb(true);
            bController.updateMovement();
        }

        if (counter % 4 === 0) {
            bController.triggerExplosion();
            bController.triggerExplodeTick();
            bController.triggerExplodeTimeDown();
        }
    }
    
}