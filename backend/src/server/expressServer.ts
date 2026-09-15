import express from "express";
import http from "http";
import routerRoom from "../routes/roomRoutes";
import type GameManager from "../bomberman/GameManager";

export class ExpressServer {
    private app: express.Express;
    private server: http.Server;
    private port: number;
    private gameManager: GameManager;

    constructor(port: number, gameManager: GameManager) {
        this.port = port;
        this.gameManager = gameManager;
        this.app = express();
        this.server = http.createServer(this.app);

        this.initMiddleware();
        this.initRoutes();
    }

    private initMiddleware(): void {
        this.app.use(express.json());
    }

    private initRoutes(): void {
        this.app.use('/api/room', routerRoom(this.gameManager));
    }

    public getServer(): http.Server {
        return this.server;
    }

    public start(): void {
        this.server.listen(this.port);
    }
}
