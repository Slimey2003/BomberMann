const MESSAGES = {
    ROOM_INVALID: "Der Raum existiert nicht mehr!",
    ROOM_CLOSED: "Der Raum wurde geschlossen",
    ROOM_ID_OR_PLAYER_NAME_EMPTY: "Bitte gib Raum-ID und Spielernamen ein!",
    ROOM_ID_INVALID: "Raum ID ungültig! (7 Zeichen, a-z, 0-9, _)",
    ROOM_PLAYER_NAME_INVALID: "Spielername ungültig! (3-10 Zeichen, A-Z, 0-9, _)",
    REGISTER_PASSWORD_INVALID: "Das Passwort muss 8 bis 20 Zeichen lang sein und mindestens eine Zahl, einen Großbuchstaben, einen Kleinbuchstaben sowie ein Sonderzeichen enthalten.",
    REGISTER_VALID: "Registrierung war Erfolgreich Log dich nun ein!",

    RATE_LIMIT_MESSAGE: "Zu viele Registerungs versuche!, bitte versuchen sie es später erneut!",
    SERVER_ERROR_FALLBACK: "Es ist was schief gelaufen. Versuch es später erneut!",
}

export const REGEX = {
    ROOM_ID: "^[a-z0-9_]{7,7}$",
    PLAYER_NAME: "^[a-zA-Z0-9_]{3,10}$",
    REGISTER_PASSWORD: "/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=])(?=\S+$).{8,20}$/",
}
export default MESSAGES;