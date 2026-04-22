import { Response } from 'express';
import { eq, and, desc, asc, sql, ilike, or, inArray } from 'drizzle-orm';
import db from '../../db/db';
import { notes, users } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateNoteInput,
    UpdateNoteInput,
    NoteQueryParams,
    PinNoteInput,
    BulkDeleteNotesInput
} from '../types/note.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

export const getNotes = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            entityType,
            entityId,
            createdBy,
            isPinned,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as NoteQueryParams;

        // Build filters
        const filters = [];

        if (entityType) {
            filters.push(eq(notes.entityType, entityType));
        }

        if (entityId) {
            filters.push(eq(notes.entityId, parseInt(entityId)));
        }

        if (createdBy) {
            filters.push(eq(notes.createdBy, parseInt(createdBy)));
        }

        if (isPinned !== undefined) {
            const pinned = String(isPinned) === 'true' || String(isPinned) === 'True';
            filters.push(eq(notes.isPinned, pinned));
        }

        if (search) {
            filters.push(ilike(notes.content, `%${search}%`));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(notes)
            .where(whereClause);

        // Get data with joins
        const sortColumn = sortBy === 'updatedAt' ? notes.updatedAt : notes.createdAt;
        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const notesData = await db
            .select({
                id: notes.id,
                entityType: notes.entityType,
                entityId: notes.entityId,
                content: notes.content,
                isPinned: notes.isPinned,
                createdBy: notes.createdBy,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
                createdByName: users.userName,
                createdByEmail: users.email
            })
            .from(notes)
            .leftJoin(users, eq(notes.createdBy, users.id))
            .where(whereClause)
            .orderBy(desc(notes.isPinned), orderClause) // Pinned notes first
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Notes retrieved successfully',
            data: notesData,
            pagination
        });
    } catch (error) {
        console.error('Error during notes retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const noteId = parseInt(req.params.id as string);
        if (!noteId || isNaN(noteId)) {
            return res.status(400).json({ status: false, message: 'Invalid note ID' });
        }

        const noteData = await db
            .select({
                id: notes.id,
                entityType: notes.entityType,
                entityId: notes.entityId,
                content: notes.content,
                isPinned: notes.isPinned,
                createdBy: notes.createdBy,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
                createdByName: users.userName,
                createdByEmail: users.email
            })
            .from(notes)
            .leftJoin(users, eq(notes.createdBy, users.id))
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!noteData || noteData.length === 0) {
            return res.status(404).json({ status: false, message: 'Note not found' });
        }

        return res.json({
            status: true,
            message: 'Note retrieved successfully',
            data: noteData[0]
        });
    } catch (error) {
        console.error('Error during note retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            entity_type,
            entity_id,
            content,
            is_pinned
        } = req.body as CreateNoteInput;

        // Validate required fields
        if (!entity_type || !['company', 'lead', 'opportunity', 'deal'].includes(entity_type)) {
            return res.status(400).json({ status: false, message: 'Valid entity type is required (company, lead, opportunity, or deal)' });
        }

        if (!entity_id) {
            return res.status(400).json({ status: false, message: 'Entity ID is required' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ status: false, message: 'Note content is required' });
        }

        const userId = req.userId!;

        const [newNote] = await db
            .insert(notes)
            .values({
                entityType: entity_type,
                entityId: entity_id,
                content: content.trim(),
                isPinned: is_pinned || false,
                createdBy: userId
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Note created successfully',
            data: newNote
        });
    } catch (error) {
        console.error('Error during note creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const noteId = parseInt(req.params.id as string);
        if (!noteId || isNaN(noteId)) {
            return res.status(400).json({ status: false, message: 'Invalid note ID' });
        }

        const { content, is_pinned } = req.body as UpdateNoteInput;

        // Check if note exists
        const existing = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Note not found' });
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (content !== undefined) {
            if (!content.trim()) {
                return res.status(400).json({ status: false, message: 'Note content cannot be empty' });
            }
            updateData.content = content.trim();
        }

        if (is_pinned !== undefined) updateData.isPinned = is_pinned;

        const [updatedNote] = await db
            .update(notes)
            .set(updateData)
            .where(eq(notes.id, noteId))
            .returning();

        return res.json({
            status: true,
            message: 'Note updated successfully',
            data: updatedNote
        });
    } catch (error) {
        console.error('Error during note update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const pinNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const noteId = parseInt(req.params.id as string);
        if (!noteId || isNaN(noteId)) {
            return res.status(400).json({ status: false, message: 'Invalid note ID' });
        }

        const { is_pinned } = req.body as PinNoteInput;

        if (is_pinned === undefined) {
            return res.status(400).json({ status: false, message: 'is_pinned field is required' });
        }

        // Check if note exists
        const existing = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Note not found' });
        }

        const [pinnedNote] = await db
            .update(notes)
            .set({
                isPinned: is_pinned,
                updatedAt: new Date()
            })
            .where(eq(notes.id, noteId))
            .returning();

        return res.json({
            status: true,
            message: `Note ${is_pinned ? 'pinned' : 'unpinned'} successfully`,
            data: pinnedNote
        });
    } catch (error) {
        console.error('Error during note pin operation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const noteId = parseInt(req.params.id as string);
        if (!noteId || isNaN(noteId)) {
            return res.status(400).json({ status: false, message: 'Invalid note ID' });
        }

        // Check if note exists
        const existing = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Note not found' });
        }

        await db
            .delete(notes)
            .where(eq(notes.id, noteId));

        return res.json({
            status: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error during note deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkDeleteNotes = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { note_ids } = req.body as BulkDeleteNotesInput;

        if (!note_ids || !Array.isArray(note_ids) || note_ids.length === 0) {
            return res.status(400).json({ status: false, message: 'Note IDs array is required' });
        }

        const deletedNotes = await db
            .delete(notes)
            .where(inArray(notes.id, note_ids))
            .returning();

        return res.json({
            status: true,
            message: `${deletedNotes.length} note(s) deleted successfully`,
            data: {
                deletedCount: deletedNotes.length
            }
        });
    } catch (error) {
        console.error('Error during bulk note deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
