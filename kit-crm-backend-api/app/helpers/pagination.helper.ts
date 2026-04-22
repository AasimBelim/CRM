import { PaginationParams, PaginationMeta } from '../types/common.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

export const getPaginationParams = (query: PaginationParams): { page: number; limit: number; offset: number } => {
    const page = Math.max(1, parseInt(String(query.page || DEFAULT_PAGE)));
    let limit = parseInt(String(query.limit || DEFAULT_LIMIT));
    
    // Enforce max limit to prevent performance issues
    limit = Math.min(limit, MAX_LIMIT);
    limit = Math.max(1, limit);
    
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
};

export const createPaginationMeta = (page: number, limit: number, total: number): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        page,
        limit,
        total,
        totalPages
    };
};
