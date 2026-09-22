import express, { type NextFunction } from "express";
import * as path from "path";
import http from "http";
import * as fs from "fs";
import routerAuth from "../routes/AuthRouter";
import type KeycloakService from "../service/KeycloakService";
import rateLimit from "express-rate-limit";

export class ExpressServer {
    private app: express.Express;
    private apiLimiter: express.RequestHandler;
    private server: http.Server;
    private port: number;
    private keyService: KeycloakService;

    constructor(port: number, keyService: KeycloakService) {
        this.keyService = keyService;
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 Min
            max: 5,
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res, next) => {
                res.status(429).json({
                    success: false,
                    message: "Zu viele Registerungs versuche!, bitte versuchen sie es später erneut!"
                });
            }
        });
        
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
        this.app.use('/api', routerAuth(this.apiLimiter, this.keyService));
    }

    public getServer(): http.Server {
        return this.server;
    }

    public start(): void {
        this.server.listen(this.port);
    }
}
