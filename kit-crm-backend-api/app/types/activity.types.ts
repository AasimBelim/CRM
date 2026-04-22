// Activity-related type definitions

export interface ActivityType {
    id: number;
    name: string;
    createdAt: Date;
}

export interface CreateActivityTypeInput {
    name: string;
}

export interface Activity {
    id: number;
    entityType: 'company' | 'lead' | 'opportunity';
    entityId: number;
    contactId: number | null;
    activityTypeId: number;
    subject: string | null;
    notes: string | null;
    duration: number | null;
    outcome: string | null;
    performedBy: number;
    activityDate: Date;
    createdAt: Date;
}

export interface CreateActivityInput {
    entity_type: 'company' | 'lead' | 'opportunity';
    entity_id: number;
    contact_id?: number;
    activity_type_id: number;
    subject?: string;
    notes?: string;
    duration?: number;
    outcome?: string;
    activity_date?: string;
}

export interface UpdateActivityInput {
    contact_id?: number;
    activity_type_id?: number;
    subject?: string;
    notes?: string;
    duration?: number;
    outcome?: string;
    activity_date?: string;
}

export interface ActivityQueryParams {
    entityType?: string;
    entityId?: string;
    activityTypeId?: string;
    performedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    outcome?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ActivityResponse extends Activity {
    activityTypeName?: string;
    performedByName?: string;
    contactName?: string;
}

export interface ActivityStats {
    totalActivities: number;
    byType: Record<string, number>;
    byOutcome: Record<string, number>;
    averageDuration: number;
}
