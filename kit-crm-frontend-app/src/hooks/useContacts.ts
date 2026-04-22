import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import contactService from "@/services/contactService";
import type {
  ContactQueryParams,
  CreateContactInput,
  UpdateContactInput,
} from "@/types/contact.types";

export function useContacts(params?: ContactQueryParams) {
  return useQuery({
    queryKey: queryKeys.contacts.list(params ?? {}),
    queryFn: () => contactService.getContacts(params),
  });
}

export function useContact(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => contactService.getContact(id),
    enabled,
  });
}

export function useContactsByCompany(companyId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.contacts.byCompany(companyId),
    queryFn: () => contactService.getContactsByCompany(companyId),
    enabled,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) =>
      contactService.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContactInput }) =>
      contactService.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contactService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}
