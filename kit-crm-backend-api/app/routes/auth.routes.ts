import express, { Router } from 'express';
import { signIn } from '../controllers/auth.controller';

const router: Router = express.Router();

router.post('/sign-in', signIn);

export default router;
