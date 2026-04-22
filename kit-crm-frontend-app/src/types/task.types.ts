import type { EntityType, Priority } from "./common.types";

export interface Task {
  id: number;
  entityType: EntityType;
  entityId: number;
  title: string;
  description?: string | null;
  taskType: string;
  priority: Priority;
  assignedTo: number;
  assignedBy?: number | null;
  dueDate: string;
  reminderDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: number | null;
  outcome?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse extends Task {
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedByName?: string | null;
  completedByName?: string | null;
  createdByName?: string | null;
}

export interface CreateTaskInput {
  entity_type: EntityType;
  entity_id: number;
  title: string;
  description?: string;
  task_type: string;
  priority: Priority;
  assigned_to: number;
  due_date: string;
  reminder_date?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  task_type?: string;
  priority?: Priority;
  assigned_to?: number;
  due_date?: string;
  reminder_date?: string;
}

export interface CompleteTaskInput {
  outcome?: string;
}

export interface BulkAssignTasksInput {
  task_ids: number[];
  assigned_to?: number;
  priority?: Priority;
}

export interface TaskQueryParams {
  entityType?: EntityType;
  entityId?: number;
  assignedTo?: number;
  assignedBy?: number;
  completed?: boolean;
  priority?: Priority;
  taskType?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  [key: string]: unknown;  // ⭐ IMPORTANT
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}
