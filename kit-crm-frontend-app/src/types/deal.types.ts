export type DealStatus = "pending" | "partial" | "won" | "lost";

export interface Deal {
  id: number;
  opportunityId: number;
  createdBy: number;
  dealValue: number;
  status: DealStatus;
  lostReasonId?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  paymentTerms?: string | null;
  closedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealResponse extends Deal {
  createdByName?: string | null;
  opportunityLeadId?: number | null;
  opportunityExpectedValue?: number | null;
  leadCompanyId?: number | null;
  leadContactId?: number | null;
  companyName?: string | null;
  contactName?: string | null;
  lostReasonText?: string | null;
}

export interface CreateDealInput {
  opportunity_id: number;
  deal_value: number;
  status?: DealStatus;
  contract_start_date?: string;
  contract_end_date?: string;
  payment_terms?: string;
  closed_date?: string;
}

export interface UpdateDealInput {
  deal_value?: number;
  status?: DealStatus;
  lost_reason_id?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  payment_terms?: string;
  closed_date?: string;
}

export interface BulkUpdateDealsInput {
  deal_ids: number[];
  status?: DealStatus;
  lost_reason_id?: number;
}

export interface DealQueryParams {
  opportunityId?: number;
  status?: DealStatus;
  minValue?: number;
  maxValue?: number;
  createdBy?: number;
  closedDateFrom?: string;
  closedDateTo?: string;
  contractStartFrom?: string;
  contractStartTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}

export interface DealStats {
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  pendingDeals: number;
  pendingValue: number;
  averageDealValue: number;
}
