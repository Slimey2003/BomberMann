import { Spinner } from "react-bootstrap";

export default function StartingOverlay() {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(30, 30, 47, 0.9)",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Spinner animation="border" variant="primary" style={{ width: "5rem", height: "5rem", borderWidth: "0.3rem" }} />
            <h2 className="text-light mt-4 fw-bold">Warte auf Spielstart...</h2>
        </div>
    )
}