import express, { Router, type Request, type Response } from 'express';
import z from 'zod';
import type KeycloakService from '../service/KeycloakService';

const signupSchema = z.object({
    username: z.string(),
    email: z.email(),
    password: z.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=])(?=\S+$).{8,20}$/),
});

export default function routerAuth(apiLimiter: express.RequestHandler, keycloakService: KeycloakService): Router {
    const router: Router = express.Router();

    router.post('/signup', apiLimiter, async (req: Request, res: Response) => {
        const signupBody = signupSchema.safeParse(req.body);
        if (!signupBody.success) {
            res.status(400);
            return;
        }
        const signupData = signupBody.data;

        const isReady = await keycloakService.createUser(signupData.username, signupData.email, signupData.password);
        res.status(isReady ? 201 : 500)
    });

    return router;
}