import { Router } from 'express';
import {
    getTasks,
    getTask,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    bulkAssignTasks,
    getTaskStats
} from '../controllers/tasks.controller';

const router = Router();

// Task Stats route (before /:id to avoid conflict)
router.get('/stats', getTaskStats);

// Bulk operations
router.post('/bulk-assign', bulkAssignTasks);

// Task routes
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/complete', completeTask);
router.delete('/:id', deleteTask);

export default router;
