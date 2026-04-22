import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import taskService from "@/services/taskService";
import type {
  TaskQueryParams,
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  BulkAssignTasksInput,
} from "@/types/task.types";

export function useTasks(params?: TaskQueryParams) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params ?? {}),
    queryFn: () => taskService.getTasks(params),
  });
}

export function useTask(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled,
  });
}

export function useTaskStats(params?: {
  assignedTo?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.tasks.stats(params),
    queryFn: () => taskService.getStats(params),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskInput }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: CompleteTaskInput }) =>
      taskService.completeTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useBulkAssignTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAssignTasksInput) => taskService.bulkAssign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
