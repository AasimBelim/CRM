import express, { Router } from 'express';
import { getRoles, getRole } from '../controllers/roles.controller';

const router: Router = express.Router();

router.get('/', getRoles);
router.get('/:id', getRole);

export default router;
