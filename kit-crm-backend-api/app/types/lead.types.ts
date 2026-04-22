import { PaginationParams, SortParams } from './common.types';

// Lead Status types
export interface LeadStatus {
    id: number;
    name: string;
    createdAt: Date;
}

export interface CreateLeadStatusInput {
    name: string;
}

export interface UpdateLeadStatusInput {
    name?: string;
}

// Lost Reason types
export interface LostReason {
    id: number;
    reason: string;
    createdAt: Date;
}

export interface CreateLostReasonInput {
    reason: string;
}

export interface UpdateLostReasonInput {
    reason?: string;
}

// Lead types
export interface Lead {
    id: number;
    companyId: number;
    contactId?: number | null;
    leadStatusId: number;
    assignedTo: number;
    priority: string;
    tags?: string | null;
    qualifiedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface LeadQueryParams extends PaginationParams, SortParams {
    companyId?: string;
    contactId?: string;
    leadStatusId?: string;
    assignedTo?: string;
    priority?: string;
    tags?: string;
    search?: string;
    createdBy?: string;
}

export interface CreateLeadInput {
    company_id: number;
    contact_id?: number;
    lead_status_id: number;
    assigned_to: number;
    priority?: string;
    tags?: string;
}

export interface UpdateLeadInput {
    contact_id?: number;
    lead_status_id?: number;
    assigned_to?: number;
    priority?: string;
    tags?: string;
    qualified_at?: Date | string | null;
}

export interface BulkAssignLeadsInput {
    lead_ids: number[];
    assigned_to: number;
}

export interface LeadResponse {
    id: number;
    companyId: number;
    companyName?: string | null;
    contactId?: number | null;
    contactName?: string | null;
    leadStatusId: number;
    leadStatusName?: string | null;
    assignedTo: number;
    assignedToName?: string | null;
    priority: string;
    tags?: string | null;
    qualifiedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
