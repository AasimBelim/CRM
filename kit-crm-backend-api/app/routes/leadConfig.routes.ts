import express, { Router } from 'express';
import {
    getLeadStatuses,
    getLeadStatus,
    createLeadStatus,
    updateLeadStatus,
    deleteLeadStatus,
    getLostReasons,
    getLostReason,
    createLostReason,
    updateLostReason,
    deleteLostReason
} from '../controllers/leadStatuses.controller';

const router: Router = express.Router();

// Lead statuses routes
router.get('/statuses', getLeadStatuses);
router.get('/statuses/:id', getLeadStatus);
router.post('/statuses', createLeadStatus);
router.put('/statuses/:id', updateLeadStatus);
router.delete('/statuses/:id', deleteLeadStatus);

// Lost reasons routes
router.get('/lost-reasons', getLostReasons);
router.get('/lost-reasons/:id', getLostReason);
router.post('/lost-reasons', createLostReason);
router.put('/lost-reasons/:id', updateLostReason);
router.delete('/lost-reasons/:id', deleteLostReason);

export default router;
