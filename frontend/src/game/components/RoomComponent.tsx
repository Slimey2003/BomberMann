import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import GameManager from "../backend/GameManager";
import SettingComponent from "./SettingsComponent";
import type Game from "../backend/objects/Game";
import type { GameStateDto } from "@project/utils";
import GameComponent from "./GameComponent";

export default function RoomComponent() {
    const manager = useMemo(() => new GameManager(), []);
    const [gameState, setGameState] = useState<GameStateDto | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<string[]>([""]);
    const [userId, setUserId] = useState<number | undefined>(undefined);
    const [roomId, setRoomId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const setting = manager.createRoom("player1", 1);
        setUserId(0);
        setPlayers(setting.players);
        setRoomId(setting.roomId);
    }, [manager]);

    useEffect(() => {
        if (!game) return;
        let animationFrameId: number;

        const loop = () => {
            const state = game?.render();
            
            if (state) {
                setGameState(state);
            }
            
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [game]);

    if (!roomId || roomId.length == 0 || userId == undefined) {
        return <></>
    }

    if (game && gameState && gameState.type !== "ending") {
        return <GameComponent gameState={gameState} game={game}/>
    }

    return (
        <>
            <style>
                {`
                .setting-card {
                    max-Width: 600px;
                }
                .responsive-border {
                    border-bottom: 1px solid var(--bs-secondary);
                }
                @media (min-width: 768px) {
                    .responsive-border {
                        border-bottom: none !important;
                        border-right: 1px solid var(--bs-secondary) !important;
                    }
                        
                    .setting-card {
                        min-Width: 700px;
                    }
                }
                `}
            </style>
            <Container fluid className="py-4 min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: "#1e1e2f" }}>
                <Card className="setting-card bg-dark text-light shadow-lg rounded-4 p-3" style={{ border: '1px solid #333' }}>
                    <Card.Header> 
                        <h1 className="text-primary">Room</h1>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Row className="m-0 h-100">
                            <Col md={5} className="p-4 responsive-border d-flex flex-column justify-content-start gap-3">   
                                <h4 className="text-primary">Players</h4>
                                {players.map(p => {
                                    return <Button key={p} variant="outline-light" className="w-100 rounded-pill py-2">{p}</Button>
                                })}
                            </Col>
                            
                            <Col md={7} className="p-3 d-flex flex-column gap-1 justify-content-center">
                                <SettingComponent manager={manager} id={userId} roomId={roomId} isAdmin={true} ></SettingComponent>
                            </Col>
                        </Row>
                        <Row className="m-4">
                            <Button variant="outline-secondary" className="w-100 text-info fw-bold rounded-3"
                                onClick={() => {
                                    setGame(manager.startGame(roomId));
                                }}
                            >Game Starten</Button>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}