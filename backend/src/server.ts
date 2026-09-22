import GameManager from "./bomberman/GameManager";
import { ExpressServer } from "./server/expressServer";
import SocketServer from "./server/socketServer";
import KeycloakService from "./service/KeycloakService";

const gameManager = new GameManager();
const keycloakService = new KeycloakService("http://keycloak:8080", "bombermann", process.env.KC_BOOTSTRAP_ADMIN_USERNAME ?? "", process.env.KC_BOOTSTRAP_ADMIN_PASSWORD ?? ""); 
const expressServer = new ExpressServer(parseInt(process.env.GAME_PORT ?? "3001", 10), keycloakService);
expressServer.start();
const socketServer = new SocketServer(expressServer.getServer(), keycloakService.getAuth(), gameManager);
socketServer.start();