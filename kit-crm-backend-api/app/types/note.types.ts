/* =========================
   NOTE TYPES
========================= */

export interface Note {
    id: number;
    entityType: 'company' | 'lead' | 'opportunity' | 'deal';
    entityId: number;
    content: string;
    isPinned: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateNoteInput {
    entity_type: 'company' | 'lead' | 'opportunity' | 'deal';
    entity_id: number;
    content: string;
    is_pinned?: boolean;
}

export interface UpdateNoteInput {
    content?: string;
    is_pinned?: boolean;
}

export interface NoteQueryParams {
    entityType?: 'company' | 'lead' | 'opportunity' | 'deal';
    entityId?: string;
    createdBy?: string;
    isPinned?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface NoteResponse extends Note {
    createdByName?: string;
    createdByEmail?: string;
}

export interface PinNoteInput {
    is_pinned: boolean;
}

export interface BulkDeleteNotesInput {
    note_ids: number[];
}
