import express, { Router, type Request, type Response } from 'express';
import GameManager from '../bomberman/GameManager';

export default function routerRoom(gameManager: GameManager): Router {
    const router: Router = express.Router();

    router.get('/:id', (req: Request, res: Response) => {
        const param: string | string[] = req.params.id;
        const roomID = Array.isArray(param) ? param[0] : param;
        
        if (!roomID) {
            return res.status(400).json({ message: 'Fehlende Raum ID' });
        }
        const room = gameManager.getRoom(roomID);
        
        if (!room) {
            return res.status(400).json({ message: 'Raum nicht gefunden' });
        }
        
        res.status(200).json({
            id: room.id,
            players: room.players
        });
    });

    return router;
}