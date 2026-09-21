import { io } from "socket.io-client";

const socket = io(`http://localhost:${import.meta.env.VITE_GAME_PORT ?? 3001}`, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
        sessionId: localStorage.getItem("jwt_token") ?? sessionStorage.getItem("jwt_token")
    }
});

export default socket;