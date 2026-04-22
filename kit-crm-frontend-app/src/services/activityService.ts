import apiCall from "@/utils/axios";
import type {
  ActivityResponse,
  ActivityType,
  ActivityStats,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityQueryParams,
} from "@/types/activity.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const activityService = {
  getActivities: async (params?: ActivityQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<ActivityResponse>>(
      "/activities",
      { params }
    );
    return response.data;
  },

  getActivity: async (id: number) => {
    const response = await apiCall.get<ApiResponse<ActivityResponse>>(
      `/activities/${id}`
    );
    return response.data;
  },

  createActivity: async (data: CreateActivityInput) => {
    const response = await apiCall.post<ApiResponse<ActivityResponse>>(
      "/activities",
      data
    );
    return response.data;
  },

  updateActivity: async (id: number, data: UpdateActivityInput) => {
    const response = await apiCall.put<ApiResponse<ActivityResponse>>(
      `/activities/${id}`,
      data
    );
    return response.data;
  },

  deleteActivity: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/activities/${id}`);
    return response.data;
  },

  // Activity Types
  getActivityTypes: async () => {
    const response = await apiCall.get<ApiResponse<ActivityType[]>>(
      "/activities/types"
    );
    return response.data;
  },

  createActivityType: async (name: string) => {
    const response = await apiCall.post<ApiResponse<ActivityType>>(
      "/activities/types",
      { name }
    );
    return response.data;
  },

  getStats: async (params?: {
    performedBy?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiCall.get<ApiResponse<ActivityStats>>(
      "/activities/stats",
      { params }
    );
    return response.data;
  },
};

export default activityService;
