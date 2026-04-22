import apiCall from "@/utils/axios";
import type {
  ContactResponse,
  CreateContactInput,
  UpdateContactInput,
  ContactQueryParams,
} from "@/types/contact.types";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";

const contactService = {
  getContacts: async (params?: ContactQueryParams) => {
    const response = await apiCall.get<PaginatedResponse<ContactResponse>>(
      "/contacts",
      { params }
    );
    return response.data;
  },

  getContact: async (id: number) => {
    const response = await apiCall.get<ApiResponse<ContactResponse>>(
      `/contacts/${id}`
    );
    return response.data;
  },

  getContactsByCompany: async (companyId: number) => {
    const response = await apiCall.get<PaginatedResponse<ContactResponse>>(
      `/contacts`,
      {
        params: {
          companyId,
          limit: 1000,
        },
      }
    );

    return response.data;
  },

  createContact: async (data: CreateContactInput) => {
    const response = await apiCall.post<ApiResponse<ContactResponse>>(
      "/contacts",
      data
    );
    return response.data;
  },

  updateContact: async (id: number, data: UpdateContactInput) => {
    const response = await apiCall.put<ApiResponse<ContactResponse>>(
      `/contacts/${id}`,
      data
    );
    return response.data;
  },

  deleteContact: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/contacts/${id}`);
    return response.data;
  },
};

export default contactService;
