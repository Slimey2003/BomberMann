import type { Canvas, GameSetting, RoomSetting } from "@project/utils";
import Game from "./objects/Game";

export default class GameManager {
    private roomSettings: {[key: string]: RoomSetting} = {}

    public createGame(roomSettings: RoomSetting) {
        const settings: GameSetting = this.generateGameSetting(roomSettings);
        const game: Game = new Game(roomSettings.players, settings);
    }


    private generateGameSetting(roomSettings: RoomSetting): GameSetting {
        switch (roomSettings.difficulty) {
            case 0: //leicht
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.85,
                    playerMaxLive: 6,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                } 
                break;
            case 2: //schwer
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.4,
                    playerMaxLive: 1,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                }
            default: //normal
                return {
                    gameTime: roomSettings.gameTime,
                    blockProbability: 0.7,
                    playerMaxLive: 3,
                    canvas: this.generateCanvas(roomSettings.canvasSize),
                }
        }
    }

    private generateCanvas(canvasSize: number): Canvas {
        switch (canvasSize) {
            case 0: { //klein
                return {
                    height: 520,
                    width: 520,
                    playerSize: 30, //30 klein 40 groß
                    wallSize: 30, //30 klein 40 groß
                    bombSize: 20, // 20 klein 30 groß
                    effectSize: 27.5 // 27.5 ddd klein 35 groß
                }
            }
            default: { //Groß
                return {
                    height: 520,
                    width: 520,
                    playerSize: 40, //30 klein 40 groß
                    wallSize: 40, //30 klein 40 groß
                    bombSize: 30, // 20 klein 30 groß
                    effectSize: 35 // 27.5 ddd klein 35 groß
                }
            }
        }
    }
}