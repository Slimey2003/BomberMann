import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import SettingComponent from "./SettingsComponent";
import GameComponent from "./GameComponent";
import EndingOverlay from "./overlay/EndingOverlay";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { type RoomSetting, type GameStateDto } from "@project/utils";
import socket from "../../socket";
import '../../style/roomComponent.css'
import WaitingOverlay from "./overlay/StartingOverlay";

export default function RoomComponent({setToastMessage}: { 
    setToastMessage: (toast: { type: string; text: string; }) => void;
}) {
    const navigate = useNavigate();
    const { roomID } = useParams();

    const [gameState, setGameState] = useState<GameStateDto | null>(null);

    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [roomSetting, setRoomSetting] = useState<RoomSetting | null>(null);
    const [players, setPlayers] = useState<string[]>([""]);
    const [joinPlayerName, setJoinPlayerName] = useState('');

    
    const [isJoining, setJoining] = useState(false);

    useEffect(() => {
        if (!socket.connected) {
            setJoining(true);
            socket.connect();
            socket.emit("state_room", (state: boolean) => {
                console.log(state);
                if (!state) {
                    navigate("/");
                    setToastMessage({text: "Der Raum existiert nicht mehr!", type: "error"})

                }
            })
        } else {
            socket.emit('is_admin', (isAdmin: boolean, settings?: RoomSetting) => {
                setIsAdmin(isAdmin);
                if (settings == undefined) {
                    setRoomSetting(null);
                    return;
                }
                setRoomSetting(settings);
            });
            socket.emit("request_players", (players: string[]) => {
                setPlayers(players);
            })
        }

        /**
         * Backend Game Tick
         */
        function gameTick(data: {state: GameStateDto}) {
            setGameState(data.state);
        }

        /**
         * Navigiert einen zum Main Menu
         */
        function roomClosed() {
            navigate("/");
        };

        /**
         * Kommt vom Backend wenn was fehlgeschlagen ist. 
         * Lösst ein ToastMessage aus oder Navigiert einen zum Main Menu
         */
        function error(data: {msg: string, roomID?: string, isJoining?: boolean}) {
            setToastMessage({ type: 'error', text: data.msg });
            if (data?.roomID !== roomID && !data?.isJoining) {
                navigate("/");
            }
        };


        socket.on("game_tick", gameTick);
        socket.on("room_players", setPlayers);
        socket.on('closed_room', roomClosed);
        socket.on("error", error);
        
        return () => {
            socket.off("game_tick", gameTick);
            socket.off("room_players", setPlayers);
            socket.off('closed_room', roomClosed);
            socket.off("error", error);
        };
    }, [roomID]);

    function handleJoinRoom() {
        if (!roomID || !joinPlayerName) {
            setToastMessage({ type: 'warning', text: 'Bitte gib Raum-ID und Spielernamen ein!' });
            return;
        }
        if (!roomID.match("^[a-z0-9_]{7,7}$")) {
            setToastMessage({ type: 'error', text: 'Raum ID ungültig! (7 Zeichen, a-z, 0-9, _)' });
            return;
        }
        if (!joinPlayerName.match("^[a-zA-Z0-9_]{3,10}$")) {
            setToastMessage({ type: 'error', text: 'Spielername ungültig! (3-10 Zeichen, A-Z, 0-9, _)' });
            return;
        }
        socket.emit('join_room', roomID, joinPlayerName, (success: boolean, isAdmin: boolean, setting: RoomSetting) => {
                if (!success) {
                    navigate("/");
                    setToastMessage({text: "Der Raum existiert nicht mehr!", type: "error"})
                    return;
                }
                setIsAdmin(isAdmin);
                if (isAdmin) {

                }
                setJoining(false);
                
            } 
        );
    };

    if (gameState) {
        if (gameState.type === "ending") {
            return (
                <EndingOverlay 
                        isAdmin={isAdmin}
                        gameState={gameState}
                        onLeave={() => {
                            setGameState(null);
                            socket.emit("leave_room");
                        }}
                        onNewGame={() => {
                            if (isAdmin) {
                                socket.emit("start_game");
                            }
                        }}
                />
            );
        }
        return <GameComponent gameState={gameState}/>
    }

    if (isJoining) {
        return (
            <Container fluid className="py-4 min-vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: "#1e1e2f" }}>
                <Card className="bg-dark text-light shadow-lg rounded-4" style={{ width: "100%", maxWidth: "500px", border: "1px solid #333" }}>
                    <Card.Body className="p-4">
                        <h2 className="text-primary mb-4 text-center fw-bold">Bomberman</h2>
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
                                    disabled={true}
                                    value={roomID}
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
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    if (isAdmin && !roomSetting) return (<WaitingOverlay waitingName="Raum"/>)

    return (
        <>
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
                                <SettingComponent setSetting={setRoomSetting} isAdmin={isAdmin} ></SettingComponent>
                            </Col>
                        </Row>
                        {isAdmin && roomSetting && (
                            <Row className="m-4 gap-4">
                                <Button variant="outline-secondary" className="w-100 text-info fw-bold rounded-3"
                                    disabled={roomSetting.roomSize>players.length
                                    }
                                    onClick={() => {
                                        socket.emit("start_game");
                                    }}
                                >Game Starten</Button>
                                <Button variant="outline-danger" className="w-100 text-white fw-bold rounded-3"
                                    onClick={() => {
                                        socket.emit("leave_room");
                                        Navigate({to: "/match"});
                                    }}
                                >Zurück zum Menu</Button>
                            </Row>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}