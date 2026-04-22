export interface DataSource {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export interface DataImport {
  id: number;
  fileName?: string | null;
  importedBy: number;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: string;
  errorLog?: string | null;
  createdAt: string;
}

export interface DataImportResponse extends DataImport {
  importedByName?: string | null;
}
