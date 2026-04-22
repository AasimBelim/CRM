import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import noteService from "@/services/noteService";
import type {
  NoteQueryParams,
  CreateNoteInput,
  UpdateNoteInput,
  PinNoteInput,
  BulkDeleteNotesInput,
} from "@/types/note.types";

export function useNotes(params?: NoteQueryParams) {
  return useQuery({
    queryKey: queryKeys.notes.list(params ?? {}),
    queryFn: () => noteService.getNotes(params),
  });
}

export function useNote(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn: () => noteService.getNote(id),
    enabled,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoteInput) => noteService.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNoteInput }) =>
      noteService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noteService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function usePinNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PinNoteInput }) =>
      noteService.pinNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function useBulkDeleteNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkDeleteNotesInput) => noteService.bulkDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}
