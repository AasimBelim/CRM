import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueryKeys";
import companyService from "@/services/companyService";
import type {
  CompanyQueryParams,
  CreateCompanyInput,
  UpdateCompanyInput,
  BulkAssignCompaniesInput,
} from "@/types/company.types";

export function useCompanies(params?: CompanyQueryParams) {
  return useQuery({
    queryKey: queryKeys.companies.list(params ?? {}),
    queryFn: () => companyService.getCompanies(params),
  });
}

export function useCompany(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companyService.getCompany(id),
    enabled,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyInput) => companyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyInput }) =>
      companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

export function useBulkAssignCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkAssignCompaniesInput) =>
      companyService.bulkAssign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}
