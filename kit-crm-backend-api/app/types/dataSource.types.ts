import { PaginationParams } from './common.types';

// Data Source types
export interface DataSource {
    id: number;
    name: string;
    isActive: boolean;
}

export interface DataSourceQueryParams extends PaginationParams {
    isActive?: string;
}

export interface CreateDataSourceInput {
    name: string;
    is_active?: boolean;
}

export interface UpdateDataSourceInput {
    name?: string;
    is_active?: boolean;
}

// Data Import types
export interface DataImport {
    id: number;
    fileName?: string | null;
    importedBy: number;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    status: string;
    errorLog?: string | null;
    createdAt: Date;
}

export interface DataImportQueryParams extends PaginationParams {
    importedBy?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface CreateDataImportInput {
    file_name?: string;
    total_records: number;
}

export interface UpdateDataImportInput {
    status?: string;
    successful_records?: number;
    failed_records?: number;
    error_log?: string;
}

export interface DataImportResponse {
    id: number;
    fileName?: string | null;
    importedBy: number;
    importedByName?: string | null;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    status: string;
    errorLog?: string | null;
    createdAt: Date;
}
