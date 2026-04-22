// src/types/lead.types.ts

export interface LeadStatus {
  id: number;
  name: string;
  createdAt: string;
}

export interface LostReason {
  id: number;
  reason: string;
  createdAt: string;
}

export interface Lead {
  id: number;
  companyId: number;
  contactId?: number | null;
  leadStatusId: number;
  assignedTo?: number | null;  // ← Made optional/nullable
  priority?: string | null;
  tags?: string | null;
  qualifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadResponse extends Lead {
  companyName?: string | null;
  contactName?: string | null;
  leadStatusName?: string | null;
  assignedToName?: string | null;
  createdBy: number;
  createdByName?: string;
}

export interface CreateLeadInput {
  companyId: number;
  contactId?: number;
  leadStatusId: number;
  assigned_to?: number;
  priority?: string;
  tags?: string;
}

export interface UpdateLeadInput {
  contactId?: number;
  leadStatusId?: number;
  assigned_to?: number;
  priority?: string;
  tags?: string;
  qualifiedAt?: string;
}

export interface BulkAssignLeadsInput {
  leadIds: number[];
  assignedTo: number;
}

export interface LeadQueryParams {
  companyId?: number;
  contactId?: number;
  leadStatusId?: number;
  assignedTo?: number;
  priority?: string;
  tags?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}