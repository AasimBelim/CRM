import { Router } from 'express';
import {
    getActivityTypes,
    createActivityType,
    getActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityStats
} from '../controllers/activities.controller';

const router = Router();

// Activity Types routes
router.get('/types', getActivityTypes);
router.post('/types', createActivityType);

// Activity Stats route (before /:id to avoid conflict)
router.get('/stats', getActivityStats);

// Activity routes
router.get('/', getActivities);
router.get('/:id', getActivity);
router.post('/', createActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
