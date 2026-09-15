import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DashboardComponent from './game/components/DashboardComponent'
import RoomComponent from './game/components/RoomComponent'
import { useState } from 'react';
import ToastNotification from './side/ToastNotification';

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
                        <Route index element={<DashboardComponent setToastMessage={setToastMessage}/>} />
                        <Route path='/match/:roomID' element={<RoomComponent setToastMessage={setToastMessage}/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>

    )
}
