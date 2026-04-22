// Opportunity-related type definitions

export interface OpportunityStage {
    id: number;
    name: string;
    probability: number | null;
    order: number;
    isActive: boolean;
    createdAt: Date;
}

export interface CreateOpportunityStageInput {
    name: string;
    probability?: number;
    order: number;
    is_active?: boolean;
}

export interface UpdateOpportunityStageInput {
    name?: string;
    probability?: number;
    order?: number;
    is_active?: boolean;
}

export interface OpportunityStageQueryParams {
    isActive?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Opportunity types
export interface Opportunity {
    id: number;
    leadId: number;
    stageId: number;
    lostReasonId: number | null;
    expectedValue: string | null;
    expectedCloseDate: Date | null;
    actualCloseDate: Date | null;
    probability: number | null;
    description: string | null;
    competitorInfo: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOpportunityInput {
    lead_id: number;
    stage_id: number;
    expected_value?: number;
    expected_close_date?: string;
    probability?: number;
    description?: string;
    competitor_info?: string;
}

export interface UpdateOpportunityInput {
    stage_id?: number;
    lost_reason_id?: number;
    expected_value?: number;
    expected_close_date?: string;
    actual_close_date?: string;
    probability?: number;
    description?: string;
    competitor_info?: string;
}

export interface OpportunityQueryParams {
    leadId?: string;
    stageId?: string;
    minValue?: string;
    maxValue?: string;
    expectedCloseDateFrom?: string;
    expectedCloseDateTo?: string;
    search?: string;
    createdBy?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface OpportunityResponse extends Opportunity {
    leadCompanyName?: string;
    leadContactName?: string;
    stageName?: string;
    lostReasonText?: string;
}

export interface BulkAssignOpportunitiesInput {
    opportunity_ids: number[];
    lead_id?: number;
    stage_id?: number;
}
