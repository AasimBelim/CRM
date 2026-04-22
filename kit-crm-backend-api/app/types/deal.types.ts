// Deal-related type definitions

export interface Deal {
    id: number;
    opportunityId: number;
    createdBy: number;
    dealValue: string;
    status: 'pending' | 'partial' | 'won' | 'lost';
    lostReasonId: number | null;
    contractStartDate: Date | null;
    contractEndDate: Date | null;
    paymentTerms: string | null;
    closedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDealInput {
    opportunity_id: number;
    deal_value: number;
    status?: 'pending' | 'partial' | 'won' | 'lost';
    contract_start_date?: string;
    contract_end_date?: string;
    payment_terms?: string;
    closed_date?: string;
}

export interface UpdateDealInput {
    deal_value?: number;
    status?: 'pending' | 'partial' | 'won' | 'lost';
    lost_reason_id?: number;
    contract_start_date?: string;
    contract_end_date?: string;
    payment_terms?: string;
    closed_date?: string;
}

export interface DealQueryParams {
    opportunityId?: string;
    status?: string;
    minValue?: string;
    maxValue?: string;
    createdBy?: string;
    closedDateFrom?: string;
    closedDateTo?: string;
    contractStartFrom?: string;
    contractStartTo?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface DealResponse extends Deal {
    createdByName?: string;
    opportunityLeadCompany?: string;
    opportunityLeadContact?: string;
    opportunityExpectedValue?: string;
    lostReasonText?: string;
}

export interface BulkUpdateDealsInput {
    deal_ids: number[];
    status?: 'pending' | 'partial' | 'won' | 'lost';
    lost_reason_id?: number;
}

export interface DealStats {
    totalDeals: number;
    totalValue: string;
    wonDeals: number;
    wonValue: string;
    lostDeals: number;
    lostValue: string;
    pendingDeals: number;
    pendingValue: string;
    averageDealValue: string;
}
