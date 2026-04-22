import apiCall from "@/utils/axios";
import type {
  LeadResponse,
  LeadStatus,
  LostReason,
  CreateLeadInput,
  UpdateLeadInput,
  BulkAssignLeadsInput,
  LeadQueryParams,
} from "@/types/lead.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const leadService = {
  getLeads: async (params?: LeadQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<LeadResponse>>(
      "/leads",
      { params }
    );
    return response.data;
  },

  getLead: async (id: number): Promise<ApiResponse<LeadResponse>> => {
    const response = await apiCall.get<ApiResponse<LeadResponse>>(
      `/leads/${id}`
    );
    return response.data;
  },

  createLead: async (data: CreateLeadInput) => {
    // Map camelCase to snake_case for backend API
    const payload = {
      company_id: data.companyId,
      contact_id: data.contactId,
      lead_status_id: data.leadStatusId,
      assigned_to: data.assigned_to,
      priority: data.priority,
      tags: data.tags,
    };

    const response = await apiCall.post<ApiResponse<LeadResponse>>(
      "/leads",
      payload
    );
    return response.data;
  },

  updateLead: async (id: number, data: UpdateLeadInput) => {
    // Map camelCase to snake_case for backend API
    const payload: Record<string, any> = {};
    
    if (data.contactId !== undefined) payload.contact_id = data.contactId;
    if (data.leadStatusId !== undefined) payload.lead_status_id = data.leadStatusId;
    if (data.assigned_to !== undefined) payload.assigned_to = data.assigned_to;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.qualifiedAt !== undefined) payload.qualified_at = data.qualifiedAt;

    const response = await apiCall.put<ApiResponse<LeadResponse>>(
      `/leads/${id}`,
      payload
    );
    return response.data;
  },

  deleteLead: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/leads/${id}`);
    return response.data;
  },

  bulkAssign: async (data: BulkAssignLeadsInput) => {
    // Map camelCase to snake_case for backend API
    const payload = {
      lead_ids: data.leadIds,
      assigned_to: data.assignedTo,
    };

    const response = await apiCall.post<ApiResponse>(
      "/leads/bulk-assign",
      payload
    );
    return response.data;
  },

  getLeadStatuses: async () => {
    const response = await apiCall.get<ApiResponse<LeadStatus[]>>(
      "/lead-config/statuses"
    );
    return response.data;
  },

  getLostReasons: async () => {
    const response = await apiCall.get<ApiResponse<LostReason[]>>(
      "/lead-config/lost-reasons"
    );
    return response.data;
  },
};

export default leadService;