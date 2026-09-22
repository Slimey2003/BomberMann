import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import SettingComponent from "./SettingsComponent";
import GameComponent from "./GameComponent";
import EndingOverlay from "./overlay/EndingOverlay";
import { useNavigate, useParams } from "react-router-dom";
import { type RoomSetting, type GameStateDto, GameStateDtoSchema } from "@project/utils";
import socket, { connectSocket } from "../../socket";
import '../../style/roomComponent.css'
import WaitingOverlay from "./overlay/StartingOverlay";
import ImageController from "../util/ImageController";
import type { AuthService } from "../../auth/AuthService";
import MESSAGES, {REGEX} from "@project/utils/message"

export default function RoomComponent({authService, setToastMessage}: { 
    authService: AuthService,
    setToastMessage: (toast: { type: string; text: string; }) => void;
}) {
    const navigate = useNavigate();
    const { roomID } = useParams();

    const [userProfile, setUserProfile] = useState<{id:string, displayName: string} | null>(null);
    const [gameState, setGameState] = useState<GameStateDto | null>(null);

    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [roomSetting, setRoomSetting] = useState<RoomSetting | null>(null);
    const [players, setPlayers] = useState<string[]>([""]);
    const [joinPlayerName, setJoinPlayerName] = useState('');
    const [lobby, setLobby] = useState<boolean>(true);

    const [isJoining, setJoining] = useState(false);

    useEffect(() => {
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.key) return;
            if (e.key === "Escape") {
                socket.emit("leave_room");
                navigate("/");
            }
        };

        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const socketConnection = async () => {
            if (!socket.connected) {
                setJoining(true);
                if (!await connectSocket(authService)) {
                    navigate("/");
                    return;
                }

                socket.emit("state_room", roomID, (state: boolean, isRateLimited: boolean) => {
                    if (isRateLimited) {
                        setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                        return;
                    }
                    if (!state) {
                        navigate("/");
                        setToastMessage({text: MESSAGES.ROOM_INVALID, type: "error"});
                    } else {
                        socket.emit("reconnect_room", roomID, (success: boolean, players: string[], isAdmin: boolean, settings?: RoomSetting) => {
                            if (success) {
                                setJoining(false);
                                setPlayers(players);

                                setIsAdmin(isAdmin);
                                if (settings == undefined) {
                                    setRoomSetting(null);
                                    return;
                                }
                                setRoomSetting(settings);
                            }
                        });
                    }
                });
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
                });
            }
            
            const userProfile = await authService.getUserProfile();
            if (!userProfile) return;
            setUserProfile(userProfile);
            setJoinPlayerName(userProfile.displayName);
        }
        socketConnection();

        function gameTick(state: GameStateDto) {
            const parsedState = GameStateDtoSchema.parse(state);
            setGameState(parsedState);
            if (parsedState.type === "running") {
                setLobby(false);
            }
        }

        function roomClosed() {
            setToastMessage({ type: 'error', text: MESSAGES.ROOM_CLOSED });
            navigate("/");
        }

        function error(msg: string, roomID?: string, isJoining?: boolean) {
            if (msg) setToastMessage({ type: 'error', text: msg });
            if (roomID !== roomID && !isJoining) {
                navigate("/");
            }
        }

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
    }, [roomID, navigate, setToastMessage]);

    useEffect(() => {
        const loadImages = async () => {
            const requiredImages = [
                "background", 
                "tombstone", 
                "bomb/bomb",
                "effect/effect_0",
                "effect/effect_1",
                "effect/effect_2",
                "effect/effect_3",
                "explosion/explosion_center", 
                "explosion/explosion_up_down", 
                "explosion/explosion_right_left",
                "player/player_0",
                "player/player_1",
                "player/player_2",
                "player/player_3",
                "wall/breakableWall_0",
                "wall/breakableWall_2",
                "wall/breakableWall_3",
                "wall/solidWall"
            ];
            
            await ImageController.preloadImages(requiredImages);
        }
        loadImages();
    }, []);

    function handleJoinRoom() {
        if (!roomID || !joinPlayerName) {
            setToastMessage({ type: 'warning', text: MESSAGES.ROOM_ID_OR_PLAYER_NAME_EMPTY });
            return;
        }
        if (!roomID.match(REGEX.ROOM_ID)) {
            setToastMessage({ type: 'error', text: MESSAGES.ROOM_ID_INVALID });
            return;
        }
        if (!joinPlayerName.match(REGEX.PLAYER_NAME)) {
            setToastMessage({ type: 'error', text: MESSAGES.ROOM_PLAYER_NAME_INVALID });
            return;
        }
        socket.emit('join_room', roomID, joinPlayerName, (success: boolean, isRateLimited: boolean, msg?: string) => {
                if (isRateLimited) {
                    if (msg) setToastMessage({type: "error", text: msg});
                    return;
                }
                if (msg) setToastMessage({type: "warning", text: msg})
                if (!success) {
                    navigate("/");
                    return;
                }
                setJoining(false);
            } 
        );
    }

    if (gameState && !lobby) {
        if (gameState.type === "ending") {
            return (
                <EndingOverlay 
                        isAdmin={isAdmin}
                        gameState={gameState}
                        onLeave={() => {
                            setLobby(true);
                            setGameState(null);
                            if (isAdmin) {
                                socket.emit("delete_game");
                            }
                        }}
                        onNewGame={() => {
                            if (isAdmin) {
                                socket.emit("start_game");
                            }
                        }}
                />
            );
        }
        return <GameComponent userProfile={userProfile} gameState={gameState}/>
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
                    <Card.Header className="d-flex flex-column align-items-center justify-content-center"> 
                        <h1 className="text-primary">Room: </h1>
                        <h3 className="text-info "
                            style={{
                                cursor: "pointer",
                                width: "140px"
                            }}
                            onClick={() => {
                                navigator.clipboard.writeText(location.href);
                            }}
                        
                        >{roomID}</h3>
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
                                <SettingComponent setSetting={setRoomSetting} isAdmin={isAdmin} setToastMessage={setToastMessage}></SettingComponent>
                            </Col>
                        </Row>
                        {isAdmin && roomSetting && (
                            <Row className="m-4 gap-4">
                                <Button variant="outline-secondary" className="w-100 text-info fw-bold rounded-3"
                                    disabled={players.length<2}
                                    onClick={() => {
                                        socket.emit("start_game");
                                    }}
                                >Game Starten</Button>
                                <Button variant="outline-danger" className="w-100 text-white fw-bold rounded-3"
                                    onClick={() => {
                                        socket.emit("leave_room");
                                        navigate("/");
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