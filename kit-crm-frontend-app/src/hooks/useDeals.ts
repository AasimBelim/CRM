import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import dealService from "@/services/dealService";
import type {
  DealQueryParams,
  CreateDealInput,
  UpdateDealInput,
  BulkUpdateDealsInput,
} from "@/types/deal.types";

export function useDeals(params?: DealQueryParams) {
  return useQuery({
    queryKey: queryKeys.deals.list(params ?? {}),
    queryFn: () => dealService.getDeals(params),
  });
}

export function useDeal(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.deals.detail(id),
    queryFn: () => dealService.getDeal(id),
    enabled,
  });
}

export function useDealStats(params?: {
  createdBy?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.deals.stats(params),
    queryFn: () => dealService.getStats(params),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealInput) => dealService.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDealInput }) =>
      dealService.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dealService.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });
}

export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateDealsInput) => dealService.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });
}
