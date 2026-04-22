import apiCall from "@/utils/axios";
import type { ApiResponse } from "@/types/common.types";
import type { UserFormData, UsersTableViewData } from "@/types/Users";

interface UsersResponse {
  users: UsersTableViewData[];
  total: number;
  page: number;
  limit: number;
}



const userService = {
  getUsers: async (params?: {
    search?: string;
    roleId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiCall.get<ApiResponse<UsersResponse>>("/users", {
      params,
    });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await apiCall.get<ApiResponse<UsersTableViewData>>(
      `/users/${id}`
    );
    return response.data;
  },

  createUser: async (data: UserFormData) => {
    const response = await apiCall.post<ApiResponse>("/users", data);
    return response.data;
  },

  updateUser: async (id: number, data: Partial<UserFormData>) => {
    const response = await apiCall.put<ApiResponse>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
};

export default userService;
