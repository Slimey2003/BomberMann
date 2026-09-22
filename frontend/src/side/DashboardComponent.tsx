import { useState } from "react";
import AuthOverlay from "../auth/AuthComponent";
import { AuthService } from "../auth/AuthService";
import MainMenuComponent from "../game/components/MenuComponent";
import { Header } from "./Header";


export default function DashboardComponent({ authService, setToastMessage }: { 
        authService: AuthService
        setToastMessage: (toast: { type: string; text: string; }) => void;
    }) {

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    return (
        <>
            <Header authService={authService}isAuth={isAuthenticated} />
            {!isAuthenticated && (
                <AuthOverlay authService={authService} setToastMessage={setToastMessage} onSuccess={() => setIsAuthenticated(true)}/>
            )}
            {isAuthenticated && (
                <MainMenuComponent authService={authService} setToastMessage={setToastMessage}/>
            )}
        </>
    )
}