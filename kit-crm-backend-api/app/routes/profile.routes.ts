import express, { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';

const router: Router = express.Router();

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
