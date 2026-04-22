import { PaginationParams, SortParams } from './common.types';

// Company types
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
    verifiedAt?: Date | null;
    verifiedBy?: number | null;
    createdBy: number;
    assignedTo?: number | null;
    assignedAt?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CompanyQueryParams extends PaginationParams, SortParams {
    name?: string;
    domain?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    city?: string;
    dataSourceId?: string;
    assignedTo?: string;
    createdBy?: string;
    isActive?: string;
    search?: string;
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
}

export interface UpdateCompanyInput {
    name?: string;
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

export interface BulkAssignInput {
    company_ids: number[];
    assigned_to: number;
}

export interface CompanyResponse {
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
    dataSourceName?: string | null;
    dataQuality?: number | null;
    verifiedAt?: Date | null;
    verifiedBy?: number | null;
    createdBy: number;
    createdByName?: string | null;
    assignedTo?: number | null;
    assignedToName?: string | null;
    assignedAt?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
