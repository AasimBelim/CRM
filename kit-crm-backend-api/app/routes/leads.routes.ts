import express, { Router } from 'express';
import {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    bulkAssignLeads
} from '../controllers/leads.controller';
import { trackLeadStatusChange } from '../middlewares/stageTracking.middleware';

const router: Router = express.Router();

router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.put('/:id', trackLeadStatusChange, updateLead);
router.delete('/:id', deleteLead);
router.post('/bulk-assign', bulkAssignLeads);

export default router;
