import { useState } from "react";
import { Button, Card, Container, Form, Tab, Tabs } from "react-bootstrap";
import { SettingSlider } from "./SettingsComponent";

export default function MainMenuComponent({ 
    onJoin, 
    onCreate 
}: { 
    onJoin: (roomId: string, playerName: string) => void;
    onCreate: (playerSize: number, playerName: string) => void;
}) {
    const [joinRoomId, setJoinRoomId] = useState("");
    const [joinPlayerName, setJoinPlayerName] = useState("");

    const [createPlayerName, setCreatePlayerName] = useState("");
    const [playerSize, setPlayerSize] = useState(2);

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
                                    if (createPlayerName) onCreate(playerSize, createPlayerName);
                                }} 
                                className="d-flex flex-column gap-3 mt-3"
                            >
                                <Form.Group>
                                    <SettingSlider
                                        label="Spieler Anzahl"
                                        min={0}
                                        max={3}
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
                                        value={createPlayerName}
                                        onChange={(e) => setCreatePlayerName(e.target.value)}
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
                                    if (joinRoomId && joinPlayerName) onJoin(joinRoomId, joinPlayerName);
                                }} 
                                className="d-flex flex-column gap-3 mt-3"
                            >
                                <Form.Group>
                                    <Form.Label className="text-info fw-bold">Raum ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="12345-ABC"
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