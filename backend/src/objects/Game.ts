import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";
import BombController from "./moveable/BombController";

export default class Game {
    private wallController: WallController;
    private playerController: PlayerController; 
    private bombController: BombController;

    
    constructor(playerNames: string[], height: number, width: number) {
        this.wallController = new WallController(height, width, 0.6);
        this.playerController = new PlayerController(this.wallController, playerNames, 3, height, width);
        this.bombController = new BombController(this.wallController, this.playerController);
    }
}