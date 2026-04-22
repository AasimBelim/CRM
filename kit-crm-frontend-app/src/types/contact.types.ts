// Contact types with proper pagination support

// Response from API
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

export interface ContactQueryParams {
    companyId?: string | number;
    name?: string;
    email?: string;
    isPrimary?: string;
    isActive?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: unknown;  // ⭐ IMPORTANT
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

// Pagination response meta
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// API Response wrapper
export interface ApiPaginatedResponse<T> {
    status: boolean;
    message: string;
    data: T[];
    pagination?: PaginationMeta;
}

export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

// Legacy interface for backward compatibility
export interface Contact {
    id: number;
    companyId: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    isPrimary?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Legacy input for backward compatibility
export interface CreateContactInputLegacy {
    company_id: number;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    is_primary?: boolean;
}

// Legacy update for backward compatibility
export interface UpdateContactInputLegacy {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    is_primary?: boolean;
}

// Legacy query params for backward compatibility
export interface ContactQueryParamsLegacy {
    companyId?: number;
    search?: string;
    page?: number;
    limit?: number;
}