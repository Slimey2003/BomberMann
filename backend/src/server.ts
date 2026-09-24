import RoomManager from "./bomberman/RoomManager";
import { ExpressServer } from "./server/expressServer";
import SocketServer from "./server/socketServer";
import KeycloakService from "./service/KeycloakService";
import RedisService from "./service/RedisService";

const redisService = new RedisService();
const gameManager = new RoomManager(redisService);
const keycloakService = new KeycloakService("http://keycloak:8080", "bombermann", process.env.KC_BOOTSTRAP_ADMIN_USERNAME ?? "", process.env.KC_BOOTSTRAP_ADMIN_PASSWORD ?? ""); 
const expressServer = new ExpressServer(keycloakService);
expressServer.start();
const socketServer = new SocketServer(expressServer.getServer(), keycloakService.getAuth(), gameManager);
socketServer.start();