import { formatMilliseconds, getEffectTypes, type GameStateDto } from "@project/utils";
import Canvas from "./CanvasComponent";
import { Card, Col, Container, ListGroup, ProgressBar, Row, Badge } from "react-bootstrap";
import { useEffect, useMemo } from "react";
import WaitingOverlay from "./overlay/StartingOverlay";
import socket from "../../socket";
import type { JwtPayload } from "jsonwebtoken";



export default function GameComponent({gameState}: {gameState: GameStateDto}) {

    useEffect(() => {
        const pressedKeys = new Set<string>();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.key) return;
            
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d"].includes(e.key)) {
                e.preventDefault();
                if (pressedKeys.has(e.key)) return;
            
                pressedKeys.add(e.key);
                socket.emit("player_input_action", e.key);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.key) return;
            
            if (!pressedKeys.has(e.key)) return;
            
            pressedKeys.delete(e.key);
            socket.emit("player_release_action", e.key);
        };

        const handleBlur = () => {
            pressedKeys.clear();
            socket.emit("player_clear_action");
        };

        window.addEventListener("blur", handleBlur);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);


    const formattedGameTime = gameState?.setting.gameTime ? formatMilliseconds(gameState.setting.gameTime) : "0:00";
    const formattedTimeLeft = gameState?.timeLeft ? formatMilliseconds(gameState.timeLeft) : "0:00";
    
    const timeProgress = gameState?.setting.gameTime && gameState?.timeLeft 
        ? (gameState.timeLeft / gameState.setting.gameTime) * 100 
        : 0;

    const wallSize = gameState?.setting.canvas.wallSize;
    const canvasSize = useMemo(() => {
        switch (wallSize) {
            case 15: 
                return 525;
            case 30: 
                return 510;
            default:
                return 520;
        }
    }, [wallSize]);
    const myPlayer = gameState.players.find(p => p.id === (socket.auth as { token: string | JwtPayload })?.token["sub"]);

    return (
        <>
            <Container fluid className="py-4 min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#1e1e2f" }}>
                {(gameState.type === "loading") &&
                    (<WaitingOverlay waitingName="Spiel start"/>)
                }
                <Row className="w-100 justify-content-center align-items-center">
                    <Col xs={12} xl={3} className="d-flex justify-content-center justify-content-xl-end mb-4 mb-xl-0">
                        <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: '18rem', minHeight: '25rem', border: 'none' }}>
                            <Card.Body className="p-4">
                                <Card.Title className="mb-4 text-info fw-bold fs-4">SPIELER</Card.Title>
                                <ListGroup variant="flush">
                                    {gameState?.players.map(p => {
                                        return (
                                            <ListGroup.Item key={p.id} className="bg-transparent text-light border-secondary d-flex justify-content-between align-items-center px-0">
                                                <span className={p.id == myPlayer?.id ? "text- fw-bold" : ""}>
                                                    {p.name}
                                                </span>
                                                <Badge bg={
                                                            p.lives >= 3 
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
                            <Canvas gameState={gameState} width={canvasSize} height={canvasSize} />
                        </div>
                    </Col>

                    <Col xs={12} xl={3} className="d-flex justify-content-center justify-content-xl-start mt-4 mt-xl-0">
                        <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: '18rem', minHeight: '25rem', border: 'none' }}>
                            <Card.Body className="p-4 d-flex flex-column gap-3">
                                
                                <div>
                                    <Card.Title className="text-info fw-bold mb-2 fs-5">SPIELZEIT</Card.Title>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-secondary">{formattedTimeLeft}</span>
                                        <span>{formattedGameTime}</span>
                                    </div>
                                    <ProgressBar variant="info" now={timeProgress} className="rounded-pill bg-secondary" style={{ height: "8px" }} />
                                </div>
                                
                                <hr className="border-secondary my-1" />

                                <div>
                                    <Card.Title className="text-info fw-bold mb-2 fs-5">EFFEKTE</Card.Title>
                                    
                                    <h2 className="mb-3">
                                        {gameState?.pickedEffectCount ?? 0} <span className="fs-5 text-secondary">/ {gameState?.maxEffects}</span>
                                    </h2>
                                    
                                    <div className="d-flex flex-wrap justify-content-center align-content-center gap-2">
                                        
                                        {
                                            getEffectTypes().map(e => {
                                                const pEffect = myPlayer?.effects.find(p => p.id == e.id);
                                                const isMax = pEffect ? (pEffect.level === pEffect.max) : false;
                                                return (
                                                    <div 
                                                        key={"effect_"+e}
                                                        className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill border ${isMax ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary bg-secondary bg-opacity-25'}`}
                                                    >
                                                        <img 
                                                            src={`/svg/effect/effect_${e.id}.svg`} 
                                                            width="24px" 
                                                            height="24px" 
                                                            alt={`Effect ${e.id}`}
                                                            style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))" }}
                                                        />
                                                        <span className={`fw-bold mb-0 ${isMax ? 'text-warning' : 'text-light'}`} style={{ fontSize: "0.9rem" }}>
                                                            {pEffect?.level ?? 0} <span className="text-secondary opacity-75">/ {e.maxLevel}</span>
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
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