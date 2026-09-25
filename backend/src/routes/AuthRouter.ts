import express, { Router, type Request, type Response } from 'express';
import z from 'zod';
import type KeycloakService from '../service/KeycloakService';
import MESSAGES, { REGEX } from '@project/utils/message';

const signupSchema = z.object({
    username: z.string().regex(REGEX.PLAYER_NAME, MESSAGES.ROOM_PLAYER_NAME_INVALID),
    email: z.email({ message: "Bitte gib eine gültige E-Mail-Adresse ein." }),
    password: z.string()
        .regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=])(?=\S+$).{8,20}$/, MESSAGES.REGISTER_PASSWORD_INVALID),
});

export default function routerAuth(apiLimiter: express.RequestHandler, keycloakService: KeycloakService): Router {
    const router: Router = express.Router();

    router.post('/signup', apiLimiter, async (req: Request, res: Response) => {
        const signupBody = signupSchema.safeParse(req.body);
        if (!signupBody.success) {
            const fieldErrors = signupBody.error.flatten((issue) => issue.message).fieldErrors;
            console.log("Validation failed:", fieldErrors);
            
            res.status(400).json({ errors: fieldErrors });
            return;
        }
        const signupData = signupBody.data;
        const isReady = await keycloakService.createUser(signupData.username, signupData.email, signupData.password);
        res.status(isReady ? 201 : 500).send();
    });

    return router;
}