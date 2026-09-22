import type { RoomSetting } from "@project/utils";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import socket from "../../socket";
import MESSAGES, { REGEX } from "@project/utils/message";

export function SettingSlider({ label, min, max, value, onChange, labels }: { label: string, min: number, max: number, value: number, onChange: (val: number) => void, labels: string[] }) {
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

export default function SettingComponent({isAdmin, setSetting, setToastMessage}: {isAdmin: boolean, setSetting: (settings: RoomSetting) => void,  setToastMessage: (toast: { type: string; text: string; }) => void}) {
    const [playerName, setPlayerName] = useState("");
    const [difficulty, setDifficulty] = useState(2);
    const [isLargeField, setIsLargeField] = useState(0);
    const [gameTime, setGameTime] = useState(1);
    
    return (
        <>        
            <h4 className="text-primary mb-2">Settings</h4>
            <div>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!playerName.match(REGEX.PLAYER_NAME)) {
                            setToastMessage({ type: 'error', text: MESSAGES.ROOM_PLAYER_NAME_INVALID });
                            return;
                        }
                        socket.emit("update_player_name", playerName, (isRateLimited: boolean, msg?: string) => {
                            if (isRateLimited) {
                                setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                                return;
                            }
                            if (msg) {
                                setToastMessage({text: msg, type: "warning"});
                                return;
                            }
                            setPlayerName("");
                        });
                    }} 
                    className="d-flex flex-column gap-3 mt-3"
                >
                    <Form.Control
                        size="sm"
                        type="text"
                        placeholder="Spieler Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="bg-secondary text-light border-0 mb-1 rounded-3"
                    />

                    <Button type="submit" variant="primary" className="w-100 text-light fw-bold rounded-3 mt-2 py-2">
                        SpielerName ändern
                    </Button>
                </Form>
            </div>
            
            {isAdmin && (
                <>
                    <hr/>
                    <SettingSlider
                        label="Schwierigkeitsgrad"
                        min={1}
                        max={3}
                        value={difficulty}
                        onChange={(val) => {
                            socket.emit("update_difficulty", val, (setting: RoomSetting, isRateLimited: boolean) => {
                                if (isRateLimited) {
                                    setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                                    return;
                                }
                                setSetting(setting);
                                setDifficulty(val);
                            })
                        }}
                        labels={["Leicht", "Normal", "Schwer"]}
                    />

                    <SettingSlider
                        label="Game Zeit"
                        min={0}
                        max={2}
                        value={gameTime}
                        onChange={(val) => {
                            let time = 0;
                            switch (val) {
                                case 0:
                                    time = 300_000
                                    break;
                                case 1:
                                    time = 600_000
                                    break;
                                case 2:
                                    time = 900_000
                                    break;
                            }
                            socket.emit("update_game_time", time, (setting: RoomSetting, isRateLimited: boolean) => {
                                if (isRateLimited) {
                                    setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                                    return;
                                }
                                setSetting(setting);
                                setGameTime(val);
                            })
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
                            socket.emit("update_field_size", val, (setting: RoomSetting, isRateLimited: boolean) => {
                                if (isRateLimited) {
                                    setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                                    return;
                                }
                                setSetting(setting);
                                setIsLargeField(val);
                            })
                        }}
                        labels={["Klein", "Groß", "Exp."]}
                    />
                </>
            )}
        </>
    );
}