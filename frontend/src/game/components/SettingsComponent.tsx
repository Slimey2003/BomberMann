import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import type GameManager from "../backend/GameManager";

function SettingSlider({ label, min, max, value, onChange, labels }: { label: string, min: number, max: number, value: number, onChange: (val: number) => void, labels: string[] }) {
    return (
        <div className="d-flex flex-column align-items-center justify-content-between mt-1 p-2 bg-secondary bg-opacity-25 rounded-3">
            <div className="w-100">
                <Form.Label className="text-info fw-bold mb-0 small">{label}</Form.Label>
                <Form.Range
                    style={{fontSize: '0.75rem'}}
                    min={min}
                    max={max}
                    step={1}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-secondary" style={{ fontSize: "0.75rem", marginTop: "-4px" }}>
                    {labels.map((text, index) => (
                        <span key={text} className={value === (min + index) ? "text-light fw-bold" : ""}>
                            {text}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SettingComponent({roomId, id, manager, isAdmin}: {roomId: string, id: number, manager: GameManager, isAdmin: boolean}) {
    const [playerName, setPlayerName] = useState("");
    const [difficulty, setDifficulty] = useState(2);
    const [isLargeField, setIsLargeField] = useState(0);
    const [gameTime, setGameTime] = useState(1);
    
    return (
        <>        
            <h4 className="text-primary mb-2">Settings</h4>
            <div>
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Spieler Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-secondary text-light border-0 mb-1 rounded-3"
                />
                <Button 
                    variant="primary" 
                    size="sm"
                    className="w-100 text-dark fw-bold rounded-3"
                    onClick={() => manager.updatePlayerName(roomId, id, playerName)}
                >
                    Spieler Name ändern
                </Button>
            </div>
            
            {isAdmin && (
                <>
                    <SettingSlider
                        label="Schwierigkeitsgrad"
                        min={1}
                        max={3}
                        value={difficulty}
                        onChange={(val) => {
                            setDifficulty(val);
                            manager.updateDifficulty(roomId, val);
                        }}
                        labels={["Leicht", "Normal", "Schwer"]}
                    />

                    <SettingSlider
                        label="Game Zeit"
                        min={0}
                        max={2}
                        value={gameTime}
                        onChange={(val) => {
                            setGameTime(val);
                            switch (val) {
                                case 0:
                                    manager.updateGameTime(roomId, 300_000);
                                    break;
                                case 1:
                                    manager.updateGameTime(roomId, 600_000);
                                    break;
                                case 2:
                                    manager.updateGameTime(roomId, 900_000);
                                    break;
                            }
                        }}
                        labels={["5Min", "10Min", "15Min"]}
                    />
                    
                    <SettingSlider
                        label="Spielfeld Größe"
                        min={0}
                        max={2}
                        value={isLargeField}
                        onChange={(val) => {
                            setIsLargeField(val);
                            manager.updateCanvasSize(roomId, val);
                        }}
                        labels={["Klein", "Groß", "Exp."]}
                    />
                </>
            )}
        </>
    );
}