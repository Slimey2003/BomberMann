import { io } from "socket.io-client";

const getSessionId = (): string => {
    let id = sessionStorage.getItem("sessionId");
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem("sessionId", id);
    }
    return id;
};

const socket = io("http://localhost:8000", {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
        sessionId: getSessionId()
    }
});

export default socket;