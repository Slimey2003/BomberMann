import GameManager from "./bomberman/GameManager";
import { ExpressServer } from "./server/expressServer";
import SocketServer from "./server/socketServer";

const gameManager = new GameManager();

const expressServer = new ExpressServer(parseInt(process.env.BACKEND_PORT ?? "3001", 10), gameManager);
expressServer.start();
const socketServer = new SocketServer(expressServer.getServer(), gameManager);
socketServer.start();