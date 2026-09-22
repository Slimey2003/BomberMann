import React from "react";
import { AuthService } from "../auth/AuthService";

interface HeaderProps {
    authService: AuthService;
    isAuth: boolean
}

export const Header: React.FC<HeaderProps> = ({ authService, isAuth}) => {

    const handleLogout = () => {
        authService.clearTokens();
        window.location.reload();
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 shadow">
            <div className="container-fluid">
                <span className="navbar-brand fw-bold">Bombermann</span>
                <div className="d-flex">
                    {isAuth && (
                        <button className="btn btn-outline-danger" onClick={handleLogout}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};