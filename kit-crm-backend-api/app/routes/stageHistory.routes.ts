import express from 'express';
import {
    getStageHistory,
    getSingleStageHistory,
    createStageHistory,
    getStageHistoryStats
} from '../controllers/stageHistory.controller';

const router = express.Router();

router.get('/stats', getStageHistoryStats);
router.get('/:id', getSingleStageHistory);
router.get('/', getStageHistory);
router.post('/', createStageHistory);

export default router;
