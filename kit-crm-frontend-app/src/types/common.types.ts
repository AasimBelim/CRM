// Common types used across the CRM application

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  page?: number;
  limit?: number;
  total?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
  userData?: T;
}

export interface PaginatedResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

export type EntityType = "company" | "lead" | "opportunity" | "deal";
export type ActivityEntityType = "company" | "lead" | "opportunity";
export type StageEntityType = "lead" | "opportunity";
export type Priority = "low" | "medium" | "high" | "urgent";