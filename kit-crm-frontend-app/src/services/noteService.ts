import apiCall from "@/utils/axios";
import type {
  NoteResponse,
  CreateNoteInput,
  UpdateNoteInput,
  NoteQueryParams,
  PinNoteInput,
  BulkDeleteNotesInput,
} from "@/types/note.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const noteService = {
  // Get notes with filtering and pagination
  getNotes: async (params?: NoteQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<NoteResponse>>(
      "/notes",
      { params }
    );
    return response.data;
  },

  // Get single note by ID
  getNote: async (id: number) => {
    const response = await apiCall.get<ApiResponse<NoteResponse>>(
      `/notes/${id}`
    );
    return response.data;
  },

  // Create new note
  createNote: async (data: CreateNoteInput) => {
    const response = await apiCall.post<ApiResponse<NoteResponse>>(
      "/notes",
      data
    );
    return response.data;
  },

  // Update note
  updateNote: async (id: number, data: UpdateNoteInput) => {
    const response = await apiCall.put<ApiResponse<NoteResponse>>(
      `/notes/${id}`,
      data
    );
    return response.data;
  },

  // Delete note
  deleteNote: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(
      `/notes/${id}`
    );
    return response.data;
  },

  // Pin/unpin note
  pinNote: async (id: number, data: PinNoteInput) => {
    const response = await apiCall.post<ApiResponse<NoteResponse>>(
      `/notes/${id}/pin`,
      data
    );
    return response.data;
  },

  // Bulk delete notes
  bulkDelete: async (data: BulkDeleteNotesInput) => {
    const response = await apiCall.post<ApiResponse>(
      "/notes/bulk-delete",
      data
    );
    return response.data;
  },
};

export default noteService;