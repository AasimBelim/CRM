import apiCall from "@/utils/axios";
import type {
  DealResponse,
  DealStats,
  CreateDealInput,
  UpdateDealInput,
  BulkUpdateDealsInput,
  DealQueryParams,
} from "@/types/deal.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const dealService = {
  getDeals: async (params?: DealQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<DealResponse>>(
      "/deals",
      { params }
    );
    return response.data;
  },

  getDeal: async (id: number) => {
    const response = await apiCall.get<ApiResponse<DealResponse>>(
      `/deals/${id}`
    );
    return response.data;
  },

  createDeal: async (data: CreateDealInput) => {
    const response = await apiCall.post<ApiResponse<DealResponse>>(
      "/deals",
      data
    );
    return response.data;
  },

  updateDeal: async (id: number, data: UpdateDealInput) => {
    const response = await apiCall.put<ApiResponse<DealResponse>>(
      `/deals/${id}`,
      data
    );
    return response.data;
  },

  deleteDeal: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/deals/${id}`);
    return response.data;
  },

  bulkUpdate: async (data: BulkUpdateDealsInput) => {
    const response = await apiCall.post<ApiResponse>(
      "/deals/bulk-update",
      data
    );
    return response.data;
  },

  getStats: async (params?: {
    createdBy?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiCall.get<ApiResponse<DealStats>>("/deals/stats", {
      params,
    });
    return response.data;
  },
};

export default dealService;
