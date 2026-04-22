import { Router } from 'express';
import {
    getNotes,
    getNote,
    createNote,
    updateNote,
    pinNote,
    deleteNote,
    bulkDeleteNotes
} from '../controllers/notes.controller';

const router = Router();

// Bulk operations (before /:id to avoid route conflicts)
router.post('/bulk-delete', bulkDeleteNotes);

// Note routes
router.get('/', getNotes);
router.get('/:id', getNote);
router.post('/', createNote);
router.put('/:id', updateNote);
router.post('/:id/pin', pinNote);
router.delete('/:id', deleteNote);

export default router;
