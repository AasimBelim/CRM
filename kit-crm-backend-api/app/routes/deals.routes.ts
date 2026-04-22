import { Router } from 'express';
import {
    getDeals,
    getDeal,
    createDeal,
    updateDeal,
    deleteDeal,
    bulkUpdateDeals,
    getDealStats
} from '../controllers/deals.controller';

const router = Router();

// Deals Routes
router.get('/stats', getDealStats);
router.get('/', getDeals);
router.get('/:id', getDeal);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);
router.post('/bulk-update', bulkUpdateDeals);

export default router;
