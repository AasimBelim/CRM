export interface OpportunityStage {
  id: number;
  name: string;
  probability?: number | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStageInput {
  name: string;
  probability?: number;
  order: number;
  is_active?: boolean;
}

export interface UpdateStageInput {
  name?: string;
  probability?: number;
  order?: number;
  is_active?: boolean;
}

export interface Opportunity {
  id: number;
  leadId: number;
  stageId: number;
  lostReasonId?: number | null;
  expectedValue?: number | null;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  probability?: number | null;
  description?: string | null;
  competitorInfo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityResponse extends Opportunity {
  stageName?: string | null;
  leadCompanyId?: number | null;
  leadCompanyName?: string | null;
  leadContactId?: number | null;
  leadContactName?: string | null;
  lostReasonText?: string | null;
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

export interface BulkUpdateOpportunitiesInput {
  opportunity_ids: number[];
  lead_id?: number;
  stage_id?: number;
}

export interface OpportunityQueryParams {
  leadId?: number;
  stageId?: number;
  minValue?: number;
  maxValue?: number;
  expectedCloseDateFrom?: string;
  expectedCloseDateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}
