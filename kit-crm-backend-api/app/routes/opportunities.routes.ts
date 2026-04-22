import { Router } from 'express';
import {
    getOpportunityStages,
    getOpportunityStage,
    createOpportunityStage,
    updateOpportunityStage,
    deleteOpportunityStage,
    getOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    bulkAssignOpportunities
} from '../controllers/opportunities.controller';
import { trackOpportunityStageChange } from '../middlewares/stageTracking.middleware';
const router = Router();

// Opportunity Stages Routes
router.get('/stages', getOpportunityStages);
router.get('/stages/:id', getOpportunityStage);
router.post('/stages', createOpportunityStage);
router.put('/stages/:id', updateOpportunityStage);
router.delete('/stages/:id', deleteOpportunityStage);

// Opportunities Routes
router.get('/', getOpportunities);
router.get('/:id', getOpportunity);
router.post('/', createOpportunity);
router.put('/:id', trackOpportunityStageChange, updateOpportunity);
router.delete('/:id', deleteOpportunity);
router.post('/bulk-assign', bulkAssignOpportunities);

export default router;