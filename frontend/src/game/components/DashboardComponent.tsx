import { useMemo, useState } from "react";
import MainMenuComponent from "./MenuComponent";
import GameManager from "../backend/GameManager";
import RoomComponent from "./RoomComponent";

export default function DashboardComponent() {
    const manager = useMemo(() => new GameManager(), []);
    const [userId, setUserId] = useState<number | undefined>();
    const [roomId, setRoomId] = useState<string | undefined>();
    
    return (
        <>
            {roomId && userId !== undefined && (
                <RoomComponent userId={userId} roomId={roomId} manager={manager}/>
            )}
            <MainMenuComponent 
                onJoin={(roomId, player) => {
                    const id = manager.addPlayer(roomId, player);
                    setRoomId(roomId);
                    setUserId(id);
                }} 
                onCreate={(size, player) => {
                    const setting = manager.createRoom(player, size);
                    setUserId(0);
                    setRoomId(setting.roomId);
                }}
            />
        </>
    )
}