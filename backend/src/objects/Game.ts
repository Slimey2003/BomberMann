import WallManager from "./wall/WallManager";
import Player from "./moveable/Player";
import Vector from "./utils/Vector";

export default class Game {
    private field: WallManager;
    private players: Player[];

    constructor(playerNames: string[], height: number, width: number) {
        this.field = new WallManager(height, width, 0.6);
        this.players = [];
        this.genPlayer(playerNames, height, width);
    }

    public genPlayer(playerNames: string[], height: number, width: number) {
        const xLast = width - 2;
        const yLast = height - 2;

        //links oben, rechts unten, links unten, rechts oben
        const pos: Vector[] = [new Vector(1, 1), new Vector(xLast, yLast), new Vector(1, yLast), new Vector(xLast, 1)];
        for (let i = 0; i < playerNames.length; i++) {
            this.players.push(new Player(i, playerNames[0], pos[i]))
        }
    }
}