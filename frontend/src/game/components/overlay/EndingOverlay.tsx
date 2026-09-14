import { Button, Card, Col, Row } from "react-bootstrap";
import { formatMilliseconds, type GameStateDto } from "@project/utils";

export default function EndingOverlay({ gameState, onLeave, onNewGame }: { gameState: GameStateDto | null, onLeave: () => void, onNewGame: () => void }) {
    if (!gameState || gameState.type !== "ending") {
        return <></>;
    }

    const isSinglePlayer = gameState.players.length === 1;
    const survivors = gameState.players.filter(p => !p.dead);
    
    let title = "Game Over";
    
    if (!isSinglePlayer) {
        if (survivors.length === 1) {
            title = `${(survivors[0] as any).name || "Spieler " + survivors[0].id} gewinnt!`;
        } else if (survivors.length > 1) {
            title = "Unentschieden!";
        } else {
            title = "Alle sind gestorben!";
        }
    } else {
        title = survivors.length > 0 ? "Gewonnen!" : "Gestorben!";
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(30, 30, 47, 0.9)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Card className="bg-dark text-light shadow-lg rounded-4 p-4" style={{ width: "100%", maxWidth: "500px", border: "1px solid #333" }}>
                <Card.Body className="text-center">
                    <h1 className="text-primary mb-4 fw-bold">{title}</h1>
                    
                    <Row className="mb-4 text-start">
                        <Col xs={8} className="text-info fw-bold mb-2">Restzeit:</Col>
                        <Col xs={4} className="text-light">{formatMilliseconds(gameState.timeLeft)}</Col>
                        
                        <Col xs={8} className="text-info fw-bold mb-2">Platzierte Bomben:</Col>
                        <Col xs={4} className="text-light">{gameState.bombPlaceCount}</Col>
                        
                        <Col xs={8} className="text-info fw-bold mb-2">Zerstörte Wände:</Col>
                        <Col xs={4} className="text-light">{gameState.wallBreaksCount} / {gameState.wallBreakableCount}</Col>
                        
                        <Col xs={8} className="text-info fw-bold mb-2">Gesammelte Effekte:</Col>
                        <Col xs={4} className="text-light">{gameState.pickedEffectCount} / {gameState.maxEffects}</Col>
                    </Row>
                    <Row className="gap-2 mx-4">
                        <Button variant="outline-light" className="w-100 rounded-3 py-2 fw-bold" onClick={onLeave}>
                            Zurück zur Lobby
                        </Button>
                        <Button variant="outline-light" className="w-100 rounded-3 py-2 fw-bold" onClick={onNewGame}>
                            Neues Game
                        </Button>
                    </Row>
                    
                </Card.Body>
            </Card>
        </div>
    );
}