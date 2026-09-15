import { useEffect } from 'react';
import "../style/toastNotification.css";
import { Toast } from 'react-bootstrap';

export default function ToastNotification({ message, onClose }: {message: {type: string, text: string} | null, onClose: () => void}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return <></>;
    let bgColor = message.type === 'success' ? 'bg-success' : 
                    message.type === 'error' ? 'bg-danger' : 
                    'bg-warning';

    return (
        <Toast 
            className={`show position-fixed toast-responsive ${bgColor} text-white`} 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            style={{ zIndex: 1080 }} 
        >
            <div className="d-flex">
                <Toast.Body>
                    {message.text}
                </Toast.Body>
                <button 
                    type="button" 
                    className="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" 
                    aria-label="Close"
                    onClick={onClose}
                ></button>
            </div>
        </Toast>
    );
}