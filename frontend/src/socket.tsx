import { io } from "socket.io-client";
import { AuthService } from "./auth/AuthService";

const socket = io(`http://localhost:${import.meta.env.VITE_GAME_PORT ?? 3001}`, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export const connectSocket = async (authService: AuthService): Promise<boolean> => {
    const token = await authService.getToken();
    
    if (token) {
        socket.auth = { token: token };
        socket.connect();
        return true;
    }
    return false;
};

export default socket;