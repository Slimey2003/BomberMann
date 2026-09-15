import { useEffect, useState } from "react";
import { Button, Card, Container, Form, Tab, Tabs } from "react-bootstrap";
import { SettingSlider } from "./SettingsComponent";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";

export default function MainMenuComponent({
    setToastMessage
}: { 
    setToastMessage: (toast: { type: string; text: string; }) => void;
}) {
    const navigate = useNavigate();
    
    const [joinRoomId, setJoinRoomId] = useState("");
    const [joinPlayerName, setJoinPlayerName] = useState("");
    const [playerSize, setPlayerSize] = useState(1);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
    }, []);

    function handleCreateRoom() {
        if (!joinPlayerName.match(/^[a-zA-Z0-9_]{3,10}$/)) {
            setToastMessage({ type: 'error', text: 'Spielername ungültig! (3-10 Zeichen, A-Z, 0-9, _)' });
            return;
        }
        
        socket.emit('create_room', joinPlayerName, playerSize, (roomId: string) => {
            if (roomId) {
                navigate(`/match/${roomId}`);
            }
        });
    }

    function handleJoinRoom() {
        if (!joinRoomId || !joinPlayerName) {
            setToastMessage({ type: 'warning', text: 'Bitte gib Raum-ID und Spielernamen ein!' });
            return;
        }
        if (!joinRoomId.match(/^[a-z0-9_]{7,7}$/)) {
            setToastMessage({ type: 'error', text: 'Raum ID ungültig! (7 Zeichen, a-z, 0-9, _)' });
            return;
        }
        if (!joinPlayerName.match(/^[a-zA-Z0-9_]{3,10}$/)) {
            setToastMessage({ type: 'error', text: 'Spielername ungültig! (3-10 Zeichen, A-Z, 0-9, _)' });
            return;
        }
        
        socket.emit('join_room', joinRoomId, joinPlayerName, (success: boolean) => {
            if (success) {
                navigate(`/match/${joinRoomId}`);
            }
        });
    }

    return (
        <Container fluid className="py-4 min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: "#1e1e2f" }}>
            <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: "100%", maxWidth: "500px", border: "1px solid #333" }}>
                <Card.Body className="p-4">
                    <h2 className="text-primary mb-4 text-center fw-bold">Bomberman</h2>
                    
                    <Tabs defaultActiveKey="create" className="mb-4 custom-tabs" justify>
                        <Tab eventKey="create" title="Raum erstellen">
                            <Form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleCreateRoom();
                                }} 
                                className="d-flex flex-column gap-3 mt-3"
                            >
                                <Form.Group>
                                    <SettingSlider
                                        label="Spieler Anzahl"
                                        min={1}
                                        max={4}
                                        value={playerSize}
                                        onChange={(val) => {
                                            setPlayerSize(val);
                                        }}
                                        labels={["Test", "2", "3", "4"]}
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label className="text-info fw-bold">Dein Spielername</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Spieler 1"
                                        value={joinPlayerName}
                                        onChange={(e) => setJoinPlayerName(e.target.value)}
                                        className="bg-secondary text-light border-0 rounded-3 p-2"
                                        required
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" className="w-100 text-dark fw-bold rounded-3 mt-2 py-2">
                                    Raum Starten
                                </Button>
                            </Form>
                        </Tab>
                        <Tab eventKey="join" title="Raum beitreten">
                            <Form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleJoinRoom();
                                }} 
                                className="d-flex flex-column gap-3 mt-3"
                            >
                                <Form.Group>
                                    <Form.Label className="text-info fw-bold">Raum ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="12345"
                                        value={joinRoomId}
                                        onChange={(e) => setJoinRoomId(e.target.value)}
                                        className="bg-secondary text-light border-0 rounded-3 p-2"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label className="text-info fw-bold">Dein Spielername</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Spielername"
                                        value={joinPlayerName}
                                        onChange={(e) => setJoinPlayerName(e.target.value)}
                                        className="bg-secondary text-light border-0 rounded-3 p-2"
                                        required
                                    />
                                </Form.Group>

                                <Button type="submit" variant="success" className="w-100 text-light fw-bold rounded-3 mt-2 py-2">
                                    Beitreten
                                </Button>
                            </Form>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </Container>
    );
}