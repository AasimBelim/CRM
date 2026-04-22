import apiCall from "@/utils/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";
import type {
  StageHistoryResponse,
  StageHistoryStats,
  CreateStageHistoryInput,
  StageHistoryQueryParams,
} from "@/types/stageHistory.types";

const stageHistoryService = {
  getStageHistory: async (params?: StageHistoryQueryParams) => {
    const response = await apiCall.get<
      PaginatedResponse<StageHistoryResponse>
    >("/stage-history", { params });
    return response.data;
  },

  getStageHistoryRecord: async (id: number) => {
    const response = await apiCall.get<ApiResponse<StageHistoryResponse>>(
      `/stage-history/${id}`
    );
    return response.data;
  },

  createStageHistory: async (data: CreateStageHistoryInput) => {
    const response = await apiCall.post<ApiResponse<StageHistoryResponse>>(
      "/stage-history",
      data
    );
    return response.data;
  },

  getStats: async (params?: {
    entityType?: string;
    entityId?: number;
  }) => {
    const response = await apiCall.get<ApiResponse<StageHistoryStats>>(
      "/stage-history/stats",
      { params }
    );
    return response.data;
  },
};

export default stageHistoryService;
