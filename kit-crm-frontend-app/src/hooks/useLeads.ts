import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import leadService from "@/services/leadService";
import type {
  LeadQueryParams,
  CreateLeadInput,
  UpdateLeadInput,
  BulkAssignLeadsInput,
} from "@/types/lead.types";

export function useLeads(params?: LeadQueryParams) {
  return useQuery({
    queryKey: queryKeys.leads.list(params ?? {}),
    queryFn: () => leadService.getLeads(params),
  });
}

export function useLead(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => leadService.getLead(id),
    enabled,
  });
}

export function useLeadStatuses() {
  return useQuery({
    queryKey: queryKeys.leads.statuses(),
    queryFn: () => leadService.getLeadStatuses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLostReasons() {
  return useQuery({
    queryKey: queryKeys.leads.lostReasons(),
    queryFn: () => leadService.getLostReasons(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLeadInput }) =>
      leadService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useBulkAssignLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAssignLeadsInput) => leadService.bulkAssign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}
