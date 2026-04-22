export interface Company {
  id: number;
  name: string;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  companySize?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
  dataSourceId?: number | null;
  dataQuality?: number | null;
  dataImportId?: number | null;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
  createdBy: number;
  assignedTo?: number | null;
  assignedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyResponse extends Company {
  dataSourceName?: string | null;
  createdByName?: string | null;
  assignedToName?: string | null;
}

export interface CreateCompanyInput {
  name: string;
  website?: string;
  domain?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  city?: string;
  address?: string;
  description?: string;
  data_source_id?: number;
  data_quality?: number;
  assigned_to?: number;
  is_active?: boolean;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {
  is_active?: boolean;
}

export interface BulkAssignCompaniesInput {
  company_ids: number[];
  assigned_to: number;
}

export interface CompanyQueryParams {
  name?: string;
  domain?: string;
  industry?: string;
  companySize?: string;
  country?: string;
  city?: string;
  dataSourceId?: number;
  assignedTo?: number;
  createdBy?: number;
  isActive?: boolean;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}
