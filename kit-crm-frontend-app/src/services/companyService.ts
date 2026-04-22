import apiCall from "@/utils/axios";
import type {
  CompanyResponse,
  CreateCompanyInput,
  UpdateCompanyInput,
  BulkAssignCompaniesInput,
  CompanyQueryParams,
} from "@/types/company.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const companyService = {
  getCompanies: async (params?: CompanyQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<CompanyResponse>>(
      "/companies",
      { params }
    );
    return response.data;
  },
  getCompanyContacts: async (companyId: number) => {
    const response = await apiCall.get(`/companies/${companyId}/contacts`);
    return response.data;
  },

  getCompany: async (id: number) => {
    const response = await apiCall.get<ApiResponse<CompanyResponse>>(
      `/companies/${id}`
    );
    return response.data;
  },

  createCompany: async (data: CreateCompanyInput) => {
    const response = await apiCall.post<ApiResponse<CompanyResponse>>(
      "/companies",
      data
    );
    return response.data;
  },

  updateCompany: async (id: number, data: UpdateCompanyInput) => {
    const response = await apiCall.put<ApiResponse<CompanyResponse>>(
      `/companies/${id}`,
      data
    );
    return response.data;
  },

  deleteCompany: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/companies/${id}`);
    return response.data;
  },

  bulkAssign: async (data: BulkAssignCompaniesInput) => {
    const response = await apiCall.post<ApiResponse>(
      "/companies/bulk-assign",
      data
    );
    return response.data;
  },
};

export default companyService;

