import express, { Router } from 'express';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware';
import {
    getOption,
    getAllOptions,
    createOrUpdateOption,
    deleteOption
} from '../controllers/options.controller.js';

const router: Router = express.Router();

// Public route - for fetching navigation menu on frontend
router.get('/:key', getOption);

// Admin routes - protected
router.get('/', verifyToken, isAdmin, getAllOptions);
router.post('/', verifyToken, isAdmin, createOrUpdateOption);
router.put('/:key', verifyToken, isAdmin, createOrUpdateOption);
router.delete('/:key', verifyToken, isAdmin, deleteOption);

export default router;
