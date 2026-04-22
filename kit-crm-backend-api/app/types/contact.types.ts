import { PaginationParams, SortParams } from './common.types';

// Contact types
export interface CompanyContact {
    id: number;
    companyId: number;
    name: string;
    email: string;
    phone?: string | null;
    linkedIn?: string | null;
    designation?: string | null;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContactQueryParams extends PaginationParams, SortParams {
    companyId?: string;
    name?: string;
    email?: string;
    isPrimary?: string;
    isActive?: string;
    search?: string;
}

export interface CreateContactInput {
    company_id: number;
    name: string;
    email: string;
    phone?: string;
    linkedin?: string;
    designation?: string;
    is_primary?: boolean;
}

export interface UpdateContactInput {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    designation?: string;
    is_primary?: boolean;
    is_active?: boolean;
}

export interface ContactResponse {
    id: number;
    companyId: number;
    companyName?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    linkedIn?: string | null;
    designation?: string | null;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
