import WallController from "./wall/WallController";
import PlayerController from "./moveable/PlayerController";

export default class Game {
    private wallManager: WallController;
    private playerManager: PlayerController; 
    constructor(playerNames: string[], height: number, width: number) {
        this.wallManager = new WallController(height, width, 0.6);
        this.playerManager = new PlayerController(playerNames, 3, height, width);
    }
}