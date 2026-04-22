// Common types used across the application

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface QueryFilters {
    [key: string]: any;
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
    sortBy?: string;
    sortOrder?: SortOrder;
}
