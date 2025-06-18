// routes/googleAuth.ts
import { Router, Request, Response } from 'express';
import googleAuthController from '../controllers/googleAuthController';

const router = Router();

// Change these to use the controller methods directly
router.get('/url', googleAuthController.getAuthUrl);
router.get('/callback', googleAuthController.handleCallback);

export default router;