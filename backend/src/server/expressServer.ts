import express from "express";
import * as path from "path";
import http from "http";
import * as fs from "fs";
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
        
        //With KI :D ermöglicht das der Backend Server das gebaute Frontend im Docker erkennt und darauf umleited wenn man localhost:3001/ macht 
        const publicPath = path.join(process.cwd(), "public");
        if (fs.existsSync(publicPath)) {
            this.app.use(express.static(publicPath));

            this.app.get(/(.*)/, (req: express.Request, res: express.Response) => {
                res.sendFile(path.join(publicPath, "index.html"));
            });
        }

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
