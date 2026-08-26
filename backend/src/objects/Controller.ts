import type EffectController from "./effect/EffectController";
import type BombController from "./moveable/BombController";
import type PlayerController from "./moveable/PlayerController";
import type WallController from "./wall/WallController";

export default class Controller {
    private wallController: WallController | undefined;
    private playerController: PlayerController | undefined; 
    private bombController: BombController | undefined;
    private effectController: EffectController | undefined;

    public init(wall: WallController, player: PlayerController, bomb: BombController, effect: EffectController) {
        this.wallController = wall;
        this.playerController = player;
        this.bombController = bomb;
        this.effectController = effect;
    }

    public getWallController(): WallController {
        if (!this.wallController) throw Error("Use Init before!");
        return this.wallController;
    }

    public getPlayerController(): PlayerController {
        if (!this.playerController) throw Error("Use Init before!");
        return this.playerController;
    }

    public getBombController(): BombController {
        if (!this.bombController) throw Error("Use Init before!");
        return this.bombController;
    }

    public getEffectController(): EffectController {
        if (!this.effectController) throw Error("Use Init before!");
        return this.effectController;
    }
}