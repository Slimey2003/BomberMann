import express from 'express';
const router = express.Router();

import GameManager from '../bomberman/GameManager';


function routerRoom(gameManager: GameManager) {
    /**
     * Ruft öffentliche Details eines spezifischen Spielraums ab (z.B. für den Game-Screen).
     */
    router.get('/:id', (req, res) => {
        const roomID = req.params.id; 

        const room = gameManager.getRoom(roomID);
        if (!room) {
            return res.status(400).json({ message: 'Raum nicht gefunden' });
        }
        // Sende nur öffentliche Raumdaten
        res.status(200).json({
            id: room.id,
            players: room.players
        });
    });
}


export default routerRoom;