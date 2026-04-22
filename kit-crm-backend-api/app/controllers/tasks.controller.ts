import { Response } from 'express';
import { eq, and, desc, asc, sql, gte, lte, ilike, or, isNull, inArray } from 'drizzle-orm';
import db from '../../db/db';
import { tasks, users } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateTaskInput,
    UpdateTaskInput,
    TaskQueryParams,
    BulkAssignTasksInput,
    CompleteTaskInput
} from '../types/task.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

export const getTasks = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            entityType,
            entityId,
            assignedTo,
            createdBy,
            completed,
            priority,
            taskType,
            dueDateFrom,
            dueDateTo,
            overdue,
            search,
            sortBy = 'dueDate',
            sortOrder = 'asc'
        } = req.query as TaskQueryParams;

        // Build filters
        const filters = [];

        if (entityType) {
            filters.push(eq(tasks.entityType, entityType));
        }

        if (entityId) {
            filters.push(eq(tasks.entityId, parseInt(entityId)));
        }

        // Allow filtering by tasks assigned to or created by the user (OR logic)
        if (assignedTo && createdBy) {
            filters.push(
                or(
                    eq(tasks.assignedTo, parseInt(assignedTo)),
                    eq(tasks.createdBy, parseInt(createdBy))
                )
            );
        } else if (assignedTo) {
            filters.push(eq(tasks.assignedTo, parseInt(assignedTo)));
        } else if (createdBy) {
            filters.push(eq(tasks.createdBy, parseInt(createdBy)));
        }

        if (completed !== undefined) {
            const isCompleted = String(completed) === 'true' || String(completed) === 'True';
            filters.push(eq(tasks.completed, isCompleted));
        }

        if (priority) {
            filters.push(eq(tasks.priority, priority));
        }

        if (taskType) {
            filters.push(eq(tasks.taskType, taskType));
        }

        if (dueDateFrom) {
            filters.push(gte(tasks.dueDate, new Date(dueDateFrom)));
        }

        if (dueDateTo) {
            filters.push(lte(tasks.dueDate, new Date(dueDateTo)));
        }

        // Overdue filter: not completed AND due date < now
        const isOverdue = String(overdue) === 'true' || String(overdue) === 'True';
        if (isOverdue) {
            filters.push(
                and(
                    eq(tasks.completed, false),
                    lte(tasks.dueDate, new Date())
                )
            );
        }

        if (search) {
            filters.push(
                or(
                    ilike(tasks.title, `%${search}%`),
                    ilike(tasks.description, `%${search}%`)
                )
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(tasks)
            .where(whereClause);

        // Get data with joins
        const sortColumn = sortBy === 'createdAt' ? tasks.createdAt :
            sortBy === 'completedAt' ? tasks.completedAt :
                sortBy === 'priority' ? tasks.priority :
                    tasks.dueDate;

        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const tasksData = await db
            .select({
                id: tasks.id,
                entityType: tasks.entityType,
                entityId: tasks.entityId,
                title: tasks.title,
                description: tasks.description,
                taskType: tasks.taskType,
                priority: tasks.priority,
                dueDate: tasks.dueDate,
                reminderDate: tasks.reminderDate,
                completed: tasks.completed,
                completedAt: tasks.completedAt,
                outcome: tasks.outcome,
                assignedTo: tasks.assignedTo,
                createdBy: tasks.createdBy,
                completedBy: tasks.completedBy,
                createdAt: tasks.createdAt,
                assignedToName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.assignedTo})`,
                createdByName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.createdBy})`,
                completedByName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.completedBy})`
            })
            .from(tasks)
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Tasks retrieved successfully',
            data: tasksData,
            pagination
        });
    } catch (error) {
        console.error('Error during tasks retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const taskId = parseInt(req.params.id as string);
        if (!taskId || isNaN(taskId)) {
            return res.status(400).json({ status: false, message: 'Invalid task ID' });
        }

        const taskData = await db
            .select({
                id: tasks.id,
                entityType: tasks.entityType,
                entityId: tasks.entityId,
                title: tasks.title,
                description: tasks.description,
                taskType: tasks.taskType,
                priority: tasks.priority,
                dueDate: tasks.dueDate,
                reminderDate: tasks.reminderDate,
                completed: tasks.completed,
                completedAt: tasks.completedAt,
                outcome: tasks.outcome,
                assignedTo: tasks.assignedTo,
                createdBy: tasks.createdBy,
                completedBy: tasks.completedBy,
                createdAt: tasks.createdAt,
                assignedToName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.assignedTo})`,
                assignedToEmail: sql<string>`(SELECT email FROM users WHERE id = ${tasks.assignedTo})`,
                createdByName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.createdBy})`,
                completedByName: sql<string>`(SELECT user_name FROM users WHERE id = ${tasks.completedBy})`
            })
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!taskData || taskData.length === 0) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        return res.json({
            status: true,
            message: 'Task retrieved successfully',
            data: taskData[0]
        });
    } catch (error) {
        console.error('Error during task retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            entity_type,
            entity_id,
            title,
            description,
            task_type,
            priority,
            due_date,
            reminder_date,
            assigned_to
        } = req.body as CreateTaskInput;

        // Validate required fields
        if (!entity_type || !['company', 'lead', 'opportunity', 'deal'].includes(entity_type)) {
            return res.status(400).json({ status: false, message: 'Valid entity type is required (company, lead, opportunity, or deal)' });
        }

        if (!entity_id) {
            return res.status(400).json({ status: false, message: 'Entity ID is required' });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ status: false, message: 'Task title is required' });
        }

        if (!task_type || !task_type.trim()) {
            return res.status(400).json({ status: false, message: 'Task type is required' });
        }

        if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
            return res.status(400).json({ status: false, message: 'Valid priority is required (low, medium, high, or urgent)' });
        }

        if (!due_date) {
            return res.status(400).json({ status: false, message: 'Due date is required' });
        }

        const userId = req.userId!;

        const [newTask] = await db
            .insert(tasks)
            .values({
                entityType: entity_type,
                entityId: entity_id,
                title: title.trim(),
                description: description || null,
                taskType: task_type.trim(),
                priority,
                dueDate: new Date(due_date),
                reminderDate: reminder_date ? new Date(reminder_date) : null,
                assignedTo: assigned_to || userId,
                createdBy: userId,
                completed: false
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Task created successfully',
            data: newTask
        });
    } catch (error) {
        console.error('Error during task creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const taskId = parseInt(req.params.id as string);
        if (!taskId || isNaN(taskId)) {
            return res.status(400).json({ status: false, message: 'Invalid task ID' });
        }

        const {
            title,
            description,
            task_type,
            priority,
            due_date,
            reminder_date,
            assigned_to
        } = req.body as UpdateTaskInput;

        // Check if task exists
        const existing = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (task_type !== undefined) updateData.taskType = task_type;
        if (priority !== undefined) {
            if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
                return res.status(400).json({ status: false, message: 'Invalid priority value' });
            }
            updateData.priority = priority;
        }
        if (due_date !== undefined) updateData.dueDate = new Date(due_date);
        if (reminder_date !== undefined) updateData.reminderDate = reminder_date ? new Date(reminder_date) : null;
        if (assigned_to !== undefined) updateData.assignedTo = assigned_to;

        const [updatedTask] = await db
            .update(tasks)
            .set(updateData)
            .where(eq(tasks.id, taskId))
            .returning();

        return res.json({
            status: true,
            message: 'Task updated successfully',
            data: updatedTask
        });
    } catch (error) {
        console.error('Error during task update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const completeTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const taskId = parseInt(req.params.id as string);
        if (!taskId || isNaN(taskId)) {
            return res.status(400).json({ status: false, message: 'Invalid task ID' });
        }

        const { outcome } = req.body as CompleteTaskInput;

        // Check if task exists
        const existing = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        if (existing[0].completed) {
            return res.status(400).json({ status: false, message: 'Task is already completed' });
        }

        const userId = req.userId!;

        const [completedTask] = await db
            .update(tasks)
            .set({
                completed: true,
                completedAt: new Date(),
                completedBy: userId,
                outcome: outcome || null
            })
            .where(eq(tasks.id, taskId))
            .returning();

        return res.json({
            status: true,
            message: 'Task completed successfully',
            data: completedTask
        });
    } catch (error) {
        console.error('Error during task completion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const taskId = parseInt(req.params.id as string);
        if (!taskId || isNaN(taskId)) {
            return res.status(400).json({ status: false, message: 'Invalid task ID' });
        }

        // Check if task exists
        const existing = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, taskId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Task not found' });
        }

        await db
            .delete(tasks)
            .where(eq(tasks.id, taskId));

        return res.json({
            status: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error during task deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkAssignTasks = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { task_ids, assigned_to } = req.body as BulkAssignTasksInput;

        if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
            return res.status(400).json({ status: false, message: 'Task IDs array is required' });
        }

        if (!assigned_to) {
            return res.status(400).json({ status: false, message: 'Assigned to user ID is required' });
        }

        // Verify user exists
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, assigned_to))
            .limit(1);

        if (!user || user.length === 0) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const userId = req.userId!;

        await db
            .update(tasks)
            .set({
                assignedTo: assigned_to,
                createdBy: userId
            })
            .where(inArray(tasks.id, task_ids));

        return res.json({
            status: true,
            message: `${task_ids.length} task(s) assigned successfully`
        });
    } catch (error) {
        console.error('Error during bulk task assignment:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getTaskStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { assignedTo, createdBy, dateFrom, dateTo } = req.query;

        // Build filters
        const filters = [];

        // Allow filtering by tasks assigned to or created by the user (OR logic)
        if (assignedTo && createdBy) {
            filters.push(
                or(
                    eq(tasks.assignedTo, parseInt(assignedTo as string)),
                    eq(tasks.createdBy, parseInt(createdBy as string))
                )
            );
        } else if (assignedTo) {
            filters.push(eq(tasks.assignedTo, parseInt(assignedTo as string)));
        } else if (createdBy) {
            filters.push(eq(tasks.createdBy, parseInt(createdBy as string)));
        }
        if (dateFrom) {
            filters.push(gte(tasks.createdAt, new Date(dateFrom as string)));
        }

        if (dateTo) {
            filters.push(lte(tasks.createdAt, new Date(dateTo as string)));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get aggregated stats
        const [stats] = await db
            .select({
                totalTasks: sql<number>`cast(count(*) as integer)`,
                completedTasks: sql<number>`cast(sum(case when completed = true then 1 else 0 end) as integer)`,
                overdueTasks: sql<number>`cast(sum(case when completed = false and due_date < now() then 1 else 0 end) as integer)`
            })
            .from(tasks)
            .where(whereClause);

        // Get counts by priority
        const byPriority = await db
            .select({
                priority: tasks.priority,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(tasks)
            .where(whereClause)
            .groupBy(tasks.priority);

        // Get counts by type
        const byType = await db
            .select({
                taskType: tasks.taskType,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(tasks)
            .where(whereClause)
            .groupBy(tasks.taskType);

        // Get counts by status
        const byStatus = await db
            .select({
                status: sql<string>`case when completed = true then 'completed' else 'pending' end`,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(tasks)
            .where(whereClause)
            .groupBy(sql`case when completed = true then 'completed' else 'pending' end`);

        const byPriorityMap: Record<string, number> = {};
        byPriority.forEach(item => {
            if (item.priority) {
                byPriorityMap[item.priority] = item.count;
            }
        });
        
        const byTypeMap: Record<string, number> = {};
        byType.forEach(item => {
            if (item.taskType) {
                byTypeMap[item.taskType] = item.count;
            }
        });

        const byStatusMap: Record<string, number> = {};
        byStatus.forEach(item => {
            byStatusMap[item.status] = item.count;
        });

        const completionRate = stats.totalTasks > 0
            ? (stats.completedTasks / stats.totalTasks) * 100
            : 0;

        return res.json({
            status: true,
            message: 'Task statistics retrieved successfully',
            data: {
                totalTasks: stats.totalTasks,
                completedTasks: stats.completedTasks,
                overdueTasks: stats.overdueTasks,
                completionRate: parseFloat(completionRate.toFixed(2)),
                byPriority: byPriorityMap,
                byType: byTypeMap,
                byStatus: byStatusMap
            }
        });
    } catch (error) {
        console.error('Error during stats retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
