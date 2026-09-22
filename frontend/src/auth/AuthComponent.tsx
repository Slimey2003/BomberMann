import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Tabs, Tab } from 'react-bootstrap';
import { AuthService } from './AuthService';
import MESSAGES, { REGEX } from '@project/utils/message';

interface AuthOverlayProps {
    authService: AuthService;
    setToastMessage: (toast: { type: string; text: string; }) => void;
    onSuccess: () => void;
}

export default function AuthOverlay({ authService, setToastMessage, onSuccess }: AuthOverlayProps) {
    const [show, setShow] = useState<boolean>(true);
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    useEffect(() => {
        const checkAuth = async () => {
            const token = await authService.getToken();
            if (token) {
                setShow(false);
                onSuccess();
            }
        };
        
        checkAuth();
    }, [authService, onSuccess]);

    const handleLogin = async (event: React.SubmitEvent) => {
        event.preventDefault();

        try {
            await authService.login(username, password);
            setShow(false);
            onSuccess();
        } catch (err: any) {
            setToastMessage({text: err.message, type: "error"});
        }
    };

    const handleRegister = async (event: React.SubmitEvent) => {
            event.preventDefault();
            if (!password.match(REGEX.REGISTER_PASSWORD)) {
                setToastMessage({text: MESSAGES.REGISTER_PASSWORD_INVALID, type:"error"})
                return;
            }
            try {
                const status = await authService.register(username, email, password);
                if (status === 201) {
                    setToastMessage({text: MESSAGES.REGISTER_VALID, type:"success"});
                    setUsername('');
                    setEmail('');
                    setPassword('');
                } else {
                    if (status === 429) {
                        setToastMessage({text: MESSAGES.RATE_LIMIT_MESSAGE, type: "error"});
                    }
                    setToastMessage({text: MESSAGES.SERVER_ERROR_FALLBACK, type:"error"});
                }
            } catch (err: any) {
                setToastMessage({text: err.message, type: "error"});
            }
    };

    return (
        <Modal 
            show={show} 
            keyboard={false}
            centered 
            style={{ backgroundColor: "#1e1e2f" }}
            contentClassName="bg-dark text-white"
        >
            <Modal.Header className="border-secondary">
                <Modal.Title className="text-primary text-center fw-bold">Anmeldung erforderlich</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs defaultActiveKey="login" className="mb-4 custom-tabs" justify>
                <Tab eventKey="login" title="Login">
                    <Form 
                        className="d-flex flex-column gap-3 mt-3"
                        onSubmit={handleLogin}
                    >
                        <Form.Group>
                            <Form.Label className="text-info fw-bold">Benutzername</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-secondary text-light border-0 rounded-3 p-2"
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label className="text-info fw-bold">Passwort</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-secondary text-light border-0 rounded-3 p-2"
                            />
                        </Form.Group>

                        <Button type="submit" variant="success" className="w-100 text-light fw-bold rounded-3 mt-2 py-2">
                            Einloggen
                        </Button>
                    </Form>
                </Tab>

                <Tab eventKey="register" title="Registrieren">
                    <Form onSubmit={handleRegister}>
                    <Form.Group className="mb-3" controlId="registerUsername">
                        <Form.Label className="text-info fw-bold">Benutzername</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-secondary text-light border-0 rounded-3 p-2"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerEmail">
                        <Form.Label className="text-info fw-bold">E-Mail</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-secondary text-light border-0 rounded-3 p-2"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="registerPassword">
                        <Form.Label className="text-info fw-bold">Passwort</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-secondary text-light border-0 rounded-3 p-2"
                        />
                    </Form.Group>

                    <Button type="submit" variant="success" className="w-100 text-light fw-bold rounded-3 mt-2 py-2">
                        Account erstellen
                    </Button>
                    </Form>
                </Tab>
                </Tabs>
            </Modal.Body>
            </Modal>
    );
};