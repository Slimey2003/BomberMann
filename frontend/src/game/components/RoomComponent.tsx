import { useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import GameManager from "../backend/GameManager";

export default function SettingComponent() {
    const [playerName, setPlayerName] = useState("");
    const [difficulty, setDifficulty] = useState(2);
    const [isLargeField, setIsLargeField] = useState(false);
    const manager = useMemo(() => new GameManager(), []);
    
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
                    <Card.Body className="p-0">
                        <Row className="m-0 h-100">
                            <Col md={5} className="p-4 responsive-border d-flex flex-column justify-content-center gap-3">    
                                <h1 className="text-primary">Room</h1>
                                <Button variant="outline-light" className="w-100 rounded-pill py-2">Spieler 1</Button>
                            </Col>
                            
                            <Col md={7} className="p-4 d-flex flex-column gap-4 justify-content-center">
                                <h1 className="text-primary">Settings</h1>
                                <div>
                                    <Form.Control
                                        type="text"
                                        placeholder="Spieler Name"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        className="bg-secondary text-light border-0 mb-2 rounded-3"
                                    />
                                    <Button variant="primary" className="w-100 text-dark fw-bold rounded-3">Spieler Name ändern</Button>
                                </div>
                            
                                <div>
                                    <Form.Label className="text-info fw-bold mb-1">Schwierigkeitsgrad</Form.Label>
                                    <Form.Range
                                        min={1}
                                        max={3}
                                        step={1}
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(Number(e.target.value))}
                                    />
                                    <div className="d-flex justify-content-between text-secondary small px-1 mt-1">
                                        <span className={difficulty === 1 ? 'text-light fw-bold' : ''}>Leicht</span>
                                        <span className={difficulty === 2 ? 'text-light fw-bold' : ''}>Normal</span>
                                        <span className={difficulty === 3 ? 'text-light fw-bold' : ''}>Schwer</span>
                                    </div>
                                </div>

                                <div className="d-flex flex-column align-items-center justify-content-between mt-2 p-3 bg-secondary bg-opacity-25 rounded-3">
                                    <div className="text-info fw-bold">Spielfeld Größe</div>
                                    <div className="d-flex align-items-center gap-3">
                                        <span className={`small ${!isLargeField ? 'text-light fw-bold' : 'text-secondary'}`}>Klein</span>
                                        <Form.Check
                                            type="switch"
                                            id="field-size-switch"
                                            checked={isLargeField}
                                            onChange={(e) => setIsLargeField(e.target.checked)}
                                            className="fs-5 m-0"
                                        />
                                        <span className={`small ${isLargeField ? 'text-light fw-bold' : 'text-secondary'}`}>Groß</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row className="m-4">
                            <Button variant="outline-secondary" className="w-100 text-info fw-bold rounded-3">Game Starten</Button>
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}