import apiCall from "@/utils/axios";
import type {
  TaskResponse,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  BulkAssignTasksInput,
  TaskQueryParams,
} from "@/types/task.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const taskService = {
  getTasks: async (params?: TaskQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<TaskResponse>>(
      "/tasks",
      { params }
    );
    return response.data;
  },

  getTask: async (id: number) => {
    const response = await apiCall.get<ApiResponse<TaskResponse>>(
      `/tasks/${id}`
    );
    return response.data;
  },

  createTask: async (data: CreateTaskInput) => {
    const response = await apiCall.post<ApiResponse<TaskResponse>>(
      "/tasks",
      data
    );
    return response.data;
  },

  updateTask: async (id: number, data: UpdateTaskInput) => {
    const response = await apiCall.put<ApiResponse<TaskResponse>>(
      `/tasks/${id}`,
      data
    );
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/tasks/${id}`);
    return response.data;
  },

  completeTask: async (id: number, data?: CompleteTaskInput) => {
    const response = await apiCall.post<ApiResponse<TaskResponse>>(
      `/tasks/${id}/complete`,
      data
    );
    return response.data;
  },

  bulkAssign: async (data: BulkAssignTasksInput) => {
    const response = await apiCall.post<ApiResponse>(
      "/tasks/bulk-assign",
      data
    );
    return response.data;
  },

  getStats: async (params?: {
    assignedTo?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiCall.get<ApiResponse<TaskStats>>(
      "/tasks/stats",
      { params }
    );
    return response.data;
  },
};

export default taskService;
