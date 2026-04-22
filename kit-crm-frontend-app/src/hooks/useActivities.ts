import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import activityService from "@/services/activityService";
import type {
  ActivityQueryParams,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/types/activity.types";

export function useActivities(params?: ActivityQueryParams) {
  return useQuery({
    queryKey: queryKeys.activities.list(params ?? {}),
    queryFn: () => activityService.getActivities(params),
  });
}

export function useActivity(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: () => activityService.getActivity(id),
    enabled,
  });
}

export function useActivityTypes() {
  return useQuery({
    queryKey: queryKeys.activities.types(),
    queryFn: () => activityService.getActivityTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityStats(params?: {
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.activities.stats(params),
    queryFn: () => activityService.getStats(params),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityInput) =>
      activityService.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateActivityInput }) =>
      activityService.updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activityService.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}
