// Task-related type definitions

export interface Task {
    id: number;
    entityType: 'company' | 'lead' | 'opportunity';
    entityId: number;
    title: string;
    description: string | null;
    taskType: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo: number;
    createdBy: number | null;
    dueDate: Date;
    reminderDate: Date | null;
    completed: boolean;
    completedAt: Date | null;
    completedBy: number | null;
    outcome: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskInput {
    entity_type: 'company' | 'lead' | 'opportunity';
    entity_id: number;
    title: string;
    description?: string;
    task_type: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to: number;
    due_date: string;
    reminder_date?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    task_type?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: number;
    due_date?: string;
    reminder_date?: string;
    completed?: boolean;
    outcome?: string;
}

export interface TaskQueryParams {
    entityType?: string;
    entityId?: string;
    assignedTo?: string;
    createdBy?: string;
    completed?: string;
    priority?: string;
    taskType?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdue?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface TaskResponse extends Task {
    assignedToName?: string;
    createdByName?: string;
    completedByName?: string;
    isOverdue?: boolean;
}

export interface BulkAssignTasksInput {
    task_ids: number[];
    assigned_to?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CompleteTaskInput {
    outcome?: string;
}

export interface TaskStats {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
}
