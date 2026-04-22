import type { ActivityEntityType } from "./common.types";

export interface ActivityType {
  id: number;
  name: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  entityType: ActivityEntityType;
  entityId: number;
  contactId?: number | null;
  activityTypeId: number;
  subject?: string | null;
  notes?: string | null;
  duration?: number | null;
  outcome?: string | null;
  performedBy: number;
  activityDate: string;
  createdAt: string;
}

export interface ActivityResponse extends Activity {
  activityTypeName?: string | null;
  performedByName?: string | null;
  contactName?: string | null;
}

export interface CreateActivityInput {
  entity_type: ActivityEntityType;
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
  entityType?: ActivityEntityType;
  entityId?: number;
  activityTypeId?: number;
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  outcome?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}

export interface ActivityStats {
  totalActivities: number;
  byType: Record<string, number>;
  byOutcome: Record<string, number>;
  averageDuration: number;
}
