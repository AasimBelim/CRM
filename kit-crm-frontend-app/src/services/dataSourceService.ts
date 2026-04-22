import apiCall from "@/utils/axios";
import type { ApiResponse } from "@/types/common.types";
import type {
  DataSource,
  DataImportResponse,
} from "@/types/dataSource.types";

const dataSourceService = {
  getDataSources: async (params?: { isActive?: boolean }) => {
    const response = await apiCall.get<ApiResponse<DataSource[]>>(
      "/data-sources",
      { params }
    );
    return response.data;
  },

  getDataSource: async (id: number) => {
    const response = await apiCall.get<ApiResponse<DataSource>>(
      `/data-sources/${id}`
    );
    return response.data;
  },

  createDataSource: async (data: { name: string; is_active?: boolean }) => {
    const response = await apiCall.post<ApiResponse<DataSource>>(
      "/data-sources",
      data
    );
    return response.data;
  },

  updateDataSource: async (
    id: number,
    data: { name?: string; is_active?: boolean }
  ) => {
    const response = await apiCall.put<ApiResponse<DataSource>>(
      `/data-sources/${id}`,
      data
    );
    return response.data;
  },

  deleteDataSource: async (id: number) => {
    const response = await apiCall.delete<ApiResponse>(
      `/data-sources/${id}`
    );
    return response.data;
  },

  getDataImports: async () => {
    const response = await apiCall.get<ApiResponse<DataImportResponse[]>>(
      "/data-imports"
    );
    return response.data;
  },
};

export default dataSourceService;
