import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DashboardComponent from './side/DashboardComponent'
import RoomComponent from './game/components/RoomComponent'
import { useState } from 'react';
import ToastNotification from './side/ToastNotification';
import { AuthService } from './auth/AuthService';

const authService = new AuthService('http://localhost');

export default function App() {
   const [toastMessage, setToastMessage] = useState<{ type: string; text: string; } | null>(null);

    return (
        <>
            <ToastNotification
                message={toastMessage} 
                onClose={() => setToastMessage(null)} 
            />
            <BrowserRouter>
                <Routes>
                    <Route path='/'>
                        <Route index element={<DashboardComponent authService={authService} setToastMessage={setToastMessage}/>} />
                        <Route path='/match/:roomID' element={<RoomComponent authService={authService} setToastMessage={setToastMessage}/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>

    )
}
