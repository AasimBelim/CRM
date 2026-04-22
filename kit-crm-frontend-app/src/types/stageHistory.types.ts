import type { StageEntityType } from "./common.types";

export interface StageHistory {
  id: number;
  entityType: StageEntityType;
  entityId: number;
  fromStageId?: number | null;
  toStageId: number;
  changedBy: number;
  notes?: string | null;
  createdAt: string;
}

export interface StageHistoryResponse extends StageHistory {
  fromStageName?: string | null;
  toStageName?: string | null;
  changedByName?: string | null;
  changedByEmail?: string | null;
  daysInStage?: number | null;
}

export interface CreateStageHistoryInput {
  entity_type: StageEntityType;
  entity_id: number;
  from_stage_id?: number;
  to_stage_id: number;
  notes?: string;
}

export interface StageHistoryQueryParams {
  entityType?: StageEntityType;
  entityId?: number;
  fromStageId?: number;
  toStageId?: number;
  changedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}

export interface StageHistoryStats {
  totalTransitions: number;
  byStage: Record<string, number>;
}
