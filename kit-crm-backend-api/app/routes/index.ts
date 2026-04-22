import express, { Router } from 'express';
import apiRoutes from './api.routes';

const router: Router = express.Router();
router.use('/api/v1', apiRoutes);

export default router;
