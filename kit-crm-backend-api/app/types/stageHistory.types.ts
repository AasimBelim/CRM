/* =========================
   STAGE HISTORY TYPES
========================= */

export interface StageHistory {
    id: number;
    entityType: 'lead' | 'opportunity';
    entityId: number;
    fromStageId: number | null;
    toStageId: number;
    changedBy: number;
    notes: string | null;
    createdAt: Date;
}

export interface CreateStageHistoryInput {
    entity_type: 'lead' | 'opportunity';
    entity_id: number;
    from_stage_id?: number | null;
    to_stage_id: number;
    notes?: string;
}

export interface StageHistoryQueryParams {
    entityType?: 'lead' | 'opportunity';
    entityId?: string;
    fromStageId?: string;
    toStageId?: string;
    changedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    limit?: string;
    sortBy?: 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface StageHistoryResponse extends StageHistory {
    fromStageName?: string;
    toStageName?: string;
    changedByName?: string;
    changedByEmail?: string;
    daysinStage?: number;
}

export interface StageHistoryStats {
    totalTransitions: number;
    averageDaysPerStage: number;
    byStage: Record<string, { count: number; averageDays: number }>;
    conversionRate: {
        leadToQualified: number;
        opportunityToWon: number;
    };
}
