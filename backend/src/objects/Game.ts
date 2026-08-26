import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";
import BombController from "./moveable/BombController";
import EffectController from "./effect/EffectController";

export default class Game {
    private static blockProbability: number = 0.6;
    private static playerLives: number = 3;

    
    private wallController: WallController;
    private playerController: PlayerController; 
    private bombController: BombController;
    private effectController: EffectController;

    constructor(playerNames: string[], height: number, width: number) {
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
    
}