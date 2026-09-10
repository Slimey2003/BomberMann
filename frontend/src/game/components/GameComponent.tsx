import { useEffect, useMemo, useState } from "react";
import Game from "../backend/objects/Game";
import PlayerInputController from "../objects/PlayerInputController";
import type { GameStateDto } from "@project/utils";
import Canvas from "./CanvasComponent";
import { Card, Col, Container, ListGroup, ProgressBar, Row, Badge } from "react-bootstrap";

const formatMilliseconds = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.max(0, Math.floor(totalSeconds / 60));
    const seconds = Math.max(0, totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function GameComponent() {
    const [gameState, setGameState] = useState<GameStateDto | null>(null);
    const game: Game = useMemo(() => Game.generateBasisGame(), []);
    const inputController = useMemo(() => new PlayerInputController(0, window), []);
    
    useEffect(() => {
        game?.gameStart();
        let animationFrameId: number;

        inputController.onSpace = () => {
            game?.getBombController().placeBomb(0);
        };

        const loop = () => {
            game?.getPlayerController().setPlayerVelocity(0, inputController.getLastDirection());
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
    }, [game, inputController]);
    
    const formattedGameTime = gameState?.setting.gameTime ? formatMilliseconds(gameState.setting.gameTime) : "0:00";
    const formattedTimeLeft = gameState?.timeLeft ? formatMilliseconds(gameState.timeLeft) : "0:00";
    
    const timeProgress = gameState?.setting.gameTime && gameState?.timeLeft 
        ? (gameState.timeLeft / gameState.setting.gameTime) * 100 
        : 0;

    const canvasSize = gameState?.setting.canvas.wallSize == 40 ? 520 : 510;

    return (
        <>
            <Container fluid className="py-4 min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#1e1e2f" }}>
                <Row className="w-100 justify-content-center align-items-center">
                    <Col xs={12} xl={3} className="d-flex justify-content-center justify-content-xl-end mb-4 mb-xl-0">
                        <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: '18rem', minHeight: '25rem', border: 'none' }}>
                            <Card.Body className="p-4">
                                <Card.Title className="mb-4 text-info fw-bold fs-4">SPIELER</Card.Title>
                                <ListGroup variant="flush">
                                    {gameState?.players.map(p => {
                                        return (
                                            <ListGroup.Item className="bg-transparent text-light border-secondary d-flex justify-content-between align-items-center px-0">
                                                {p.name} 
                                                <Badge bg={
                                                            p.lives == 3 
                                                                ? "success" 
                                                                : p.lives != 0 
                                                                ? "warning" 
                                                                : "danger" 
                                                        } pill>{p.lives}/{gameState.setting.playerMaxLive}</Badge>
                                            </ListGroup.Item>
                                        )
                                    })}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xs={12} xl="auto" className="d-flex justify-content-center">
                        <div className="shadow-lg p-2 bg-dark">
                            <Canvas gameState={gameState} width={canvasSize} height={canvasSize} /> {/** 510 klein 520 Groß **/}
                        </div>
                    </Col>

                    <Col xs={12} xl={3} className="d-flex justify-content-center justify-content-xl-start mt-4 mt-xl-0">
                        <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: '18rem', minHeight: '25rem', border: 'none' }}>
                            <Card.Body className="p-4 d-flex flex-column gap-3">
                                <div>
                                    <Card.Title className="text-info fw-bold mb-2 fs-5">SPIELZEIT</Card.Title>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>{formattedGameTime}</span>
                                        <span className="text-secondary">{formattedTimeLeft}</span>
                                    </div>
                                    <ProgressBar variant="info" now={timeProgress} className="rounded-pill bg-secondary" style={{ height: "8px" }} />
                                </div>
                                
                                <hr className="border-secondary my-1" />

                                <div>
                                    <Card.Title className="text-info fw-bold mb-2 fs-5">EFFEKTE</Card.Title>
                                    <h2 className="mb-0">{gameState?.pickedEffectCount ?? 0} <span className="fs-5 text-secondary">/ {gameState?.maxEffects}</span></h2>
                                </div>

                                <hr className="border-secondary my-1" />

                                <div>
                                    <Card.Title className="text-info fw-bold mb-2 fs-5">Platzierte Bomben</Card.Title>
                                    <h2 className="text-warning mb-0">{gameState?.bombPlaceCount ?? 0}</h2>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}