import apiCall from "@/utils/axios";
import type {
  OpportunityResponse,
  OpportunityStage,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  BulkUpdateOpportunitiesInput,
  OpportunityQueryParams,
  CreateStageInput,
  UpdateStageInput,
} from "@/types/opportunity.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const opportunityService = {
  getOpportunities: async (params?: OpportunityQueryParams) => {
    const response = await apiCall.get<
      PaginatedResponse<OpportunityResponse>
    >("/opportunities", { params });
    return response.data;
  },

  getOpportunity: async (id: number) => {
    const response = await apiCall.get<ApiResponse<OpportunityResponse>>(
      `/opportunities/${id}`
    );
    return response.data;
  },

  createOpportunity: async (data: CreateOpportunityInput) => {
    const response = await apiCall.post<ApiResponse<OpportunityResponse>>(
      "/opportunities",
      data
    );
    return response.data;
  },

  updateOpportunity: async (id: number, data: UpdateOpportunityInput) => {
    const response = await apiCall.put<ApiResponse<OpportunityResponse>>(
      `/opportunities/${id}`,
      data
    );
    return response.data;
  },

  deleteOpportunity: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(
      `/opportunities/${id}`
    );
    return response.data;
  },

  bulkUpdate: async (data: BulkUpdateOpportunitiesInput) => {
    const response = await apiCall.post<ApiResponse>(
      "/opportunities/bulk-assign",
      data
    );
    return response.data;
  },

  // Opportunity Stages
  getStages: async () => {
    const response = await apiCall.get<ApiResponse<OpportunityStage[]>>(
      "/opportunities/stages"
    );
    return response.data;
  },

  getStage: async (id: number) => {
    const response = await apiCall.get<ApiResponse<OpportunityStage>>(
      `/opportunities/stages/${id}`
    );
    return response.data;
  },

  createStage: async (data: CreateStageInput) => {
    const response = await apiCall.post<ApiResponse<OpportunityStage>>(
      "/opportunities/stages",
      data
    );
    return response.data;
  },

  updateStage: async (id: number, data: UpdateStageInput) => {
    const response = await apiCall.put<ApiResponse<OpportunityStage>>(
      `/opportunities/stages/${id}`,
      data
    );
    return response.data;
  },

  deleteStage: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(
      `/opportunities/stages/${id}`
    );
    return response.data;
  },
};

export default opportunityService;
