import type { EntityType } from "./common.types";

export interface Note {
  id: number;
  entityType: EntityType;
  entityId: number;
  content: string;
  isPinned: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteResponse extends Note {
  createdByName?: string | null;
  createdByEmail?: string | null;
}

export interface CreateNoteInput {
  entity_type: EntityType;
  entity_id: number;
  content: string;
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  is_pinned?: boolean;
}

export interface PinNoteInput {
  is_pinned: boolean;
}

export interface BulkDeleteNotesInput {
  note_ids: number[];
}

export interface NoteQueryParams {
  entityType?: EntityType;
  entityId?: number;
  createdBy?: number;
  isPinned?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;
}