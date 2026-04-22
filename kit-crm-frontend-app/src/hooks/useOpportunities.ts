import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import opportunityService from "@/services/opportunityService";
import type {
  OpportunityQueryParams,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  BulkUpdateOpportunitiesInput,
} from "@/types/opportunity.types";

export function useOpportunities(params?: OpportunityQueryParams) {
  return useQuery({
    queryKey: queryKeys.opportunities.list(params ?? {}),
    queryFn: () => opportunityService.getOpportunities(params),
  });
}

export function useOpportunity(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.opportunities.detail(id),
    queryFn: () => opportunityService.getOpportunity(id),
    enabled,
  });
}

export function useOpportunityStages() {
  return useQuery({
    queryKey: queryKeys.opportunities.stages(),
    queryFn: () => opportunityService.getStages(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOpportunityInput) =>
      opportunityService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateOpportunityInput;
    }) => opportunityService.updateOpportunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => opportunityService.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      });
    },
  });
}

export function useBulkUpdateOpportunities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateOpportunitiesInput) =>
      opportunityService.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      });
    },
  });
}
