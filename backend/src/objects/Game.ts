import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";
import BombController from "./moveable/BombController";

export default class Game {
    private static blockProbability: number = 0.6;
    private static playerLives: number = 3;

    
    private wallController: WallController;
    private playerController: PlayerController; 
    private bombController: BombController;

    constructor(playerNames: string[], height: number, width: number) {
        this.wallController = new WallController(height, width, Game.blockProbability);
        this.playerController = new PlayerController(this.wallController, playerNames, Game.playerLives, height, width);
        this.bombController = new BombController(this.wallController, this.playerController);
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
}