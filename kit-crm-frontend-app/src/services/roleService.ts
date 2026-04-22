import apiCall from "@/utils/axios";
import type { ApiResponse } from "@/types/common.types";
import type { Role } from "@/types/Roles";

const roleService = {
  getRoles: async () => {
    const response = await apiCall.get<ApiResponse<Role[]>>("/roles");
    return response.data;
  },

  getRole: async (id: number) => {
    const response = await apiCall.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data;
  },
};

export default roleService;
