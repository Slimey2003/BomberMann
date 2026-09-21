import express from "express";
import * as path from "path";
import http from "http";
import * as fs from "fs";
import routerAuth from "../routes/AuthRouter";
import type KeycloakService from "../service/KeycloakService";

export class ExpressServer {
    private app: express.Express;
    private server: http.Server;
    private port: number;
    private keyService: KeycloakService;

    constructor(port: number, keyService: KeycloakService) {
        this.keyService = keyService;
        this.port = port;
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
        this.app.use('/api', routerAuth(this.keyService));
    }

    public getServer(): http.Server {
        return this.server;
    }

    public start(): void {
        this.server.listen(this.port);
    }
}
