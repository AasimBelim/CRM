import { Response } from 'express';
import { eq, and, desc, asc, sql, gte, lte, ilike, or } from 'drizzle-orm';
import db from '../../db/db';
import { activityTypes, activities, users, companyContacts } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateActivityTypeInput,
    CreateActivityInput,
    UpdateActivityInput,
    ActivityQueryParams
} from '../types/activity.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

/* =========================
   ACTIVITY TYPES
========================= */

export const getActivityTypes = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const types = await db
            .select()
            .from(activityTypes)
            .orderBy(asc(activityTypes.name));

        return res.json({
            status: true,
            message: 'Activity types retrieved successfully',
            data: types
        });
    } catch (error) {
        console.error('Error during activity types retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createActivityType = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { name } = req.body as CreateActivityTypeInput;

        if (!name || !name.trim()) {
            return res.status(400).json({ status: false, message: 'Activity type name is required' });
        }

        // Check for duplicate
        const existing = await db
            .select()
            .from(activityTypes)
            .where(eq(activityTypes.name, name.trim()))
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ status: false, message: 'Activity type already exists' });
        }

        const [newType] = await db
            .insert(activityTypes)
            .values({ name: name.trim() })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Activity type created successfully',
            data: newType
        });
    } catch (error) {
        console.error('Error during activity type creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

/* =========================
   ACTIVITIES
========================= */

export const getActivities = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            entityType,
            entityId,
            activityTypeId,
            performedBy,
            dateFrom,
            dateTo,
            outcome,
            search,
            sortBy = 'activityDate',
            sortOrder = 'desc'
        } = req.query as ActivityQueryParams;

        // Build filters
        const filters = [];

        if (entityType) {
            filters.push(eq(activities.entityType, entityType));
        }

        if (entityId) {
            filters.push(eq(activities.entityId, parseInt(entityId)));
        }

        if (activityTypeId) {
            filters.push(eq(activities.activityTypeId, parseInt(activityTypeId)));
        }

        if (performedBy) {
            filters.push(eq(activities.performedBy, parseInt(performedBy)));
        }

        if (dateFrom) {
            filters.push(gte(activities.activityDate, new Date(dateFrom)));
        }

        if (dateTo) {
            filters.push(lte(activities.activityDate, new Date(dateTo)));
        }

        if (outcome) {
            filters.push(eq(activities.outcome, outcome));
        }

        if (search) {
            filters.push(
                or(
                    ilike(activities.subject, `%${search}%`),
                    ilike(activities.notes, `%${search}%`)
                )
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(activities)
            .where(whereClause);

        // Get data with joins
        const sortColumn = sortBy === 'createdAt' ? activities.createdAt :
            sortBy === 'duration' ? activities.duration :
                activities.activityDate;

        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const activitiesData = await db
            .select({
                id: activities.id,
                entityType: activities.entityType,
                entityId: activities.entityId,
                contactId: activities.contactId,
                activityTypeId: activities.activityTypeId,
                subject: activities.subject,
                notes: activities.notes,
                duration: activities.duration,
                outcome: activities.outcome,
                performedBy: activities.performedBy,
                activityDate: activities.activityDate,
                createdAt: activities.createdAt,
                activityTypeName: activityTypes.name,
                performedByName: users.userName,
                contactName: companyContacts.name
            })
            .from(activities)
            .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
            .leftJoin(users, eq(activities.performedBy, users.id))
            .leftJoin(companyContacts, eq(activities.contactId, companyContacts.id))
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Activities retrieved successfully',
            data: activitiesData,
            pagination
        });
    } catch (error) {
        console.error('Error during activities retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const activityId = parseInt(req.params.id as string);
        if (!activityId || isNaN(activityId)) {
            return res.status(400).json({ status: false, message: 'Invalid activity ID' });
        }

        const activityData = await db
            .select({
                id: activities.id,
                entityType: activities.entityType,
                entityId: activities.entityId,
                contactId: activities.contactId,
                activityTypeId: activities.activityTypeId,
                subject: activities.subject,
                notes: activities.notes,
                duration: activities.duration,
                outcome: activities.outcome,
                performedBy: activities.performedBy,
                activityDate: activities.activityDate,
                createdAt: activities.createdAt,
                activityTypeName: activityTypes.name,
                performedByName: users.userName,
                performedByEmail: users.email,
                contactName: companyContacts.name,
                contactEmail: companyContacts.email
            })
            .from(activities)
            .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
            .leftJoin(users, eq(activities.performedBy, users.id))
            .leftJoin(companyContacts, eq(activities.contactId, companyContacts.id))
            .where(eq(activities.id, activityId))
            .limit(1);

        if (!activityData || activityData.length === 0) {
            return res.status(404).json({ status: false, message: 'Activity not found' });
        }

        return res.json({
            status: true,
            message: 'Activity retrieved successfully',
            data: activityData[0]
        });
    } catch (error) {
        console.error('Error during activity retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            entity_type,
            entity_id,
            contact_id,
            activity_type_id,
            subject,
            notes,
            duration,
            outcome,
            activity_date
        } = req.body as CreateActivityInput;

        // Validate required fields
        if (!entity_type || !['company', 'lead', 'opportunity'].includes(entity_type)) {
            return res.status(400).json({ status: false, message: 'Valid entity type is required (company, lead, or opportunity)' });
        }

        if (!entity_id) {
            return res.status(400).json({ status: false, message: 'Entity ID is required' });
        }

        if (!activity_type_id) {
            return res.status(400).json({ status: false, message: 'Activity type ID is required' });
        }

        // Verify activity type exists
        const activityType = await db
            .select()
            .from(activityTypes)
            .where(eq(activityTypes.id, activity_type_id))
            .limit(1);

        if (!activityType || activityType.length === 0) {
            return res.status(404).json({ status: false, message: 'Activity type not found' });
        }

        const userId = req.userId!;

        const [newActivity] = await db
            .insert(activities)
            .values({
                entityType: entity_type,
                entityId: entity_id,
                contactId: contact_id || null,
                activityTypeId: activity_type_id,
                subject: subject || null,
                notes: notes || null,
                duration: duration || null,
                outcome: outcome || null,
                performedBy: userId,
                activityDate: activity_date ? new Date(activity_date) : new Date()
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Activity created successfully',
            data: newActivity
        });
    } catch (error) {
        console.error('Error during activity creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const activityId = parseInt(req.params.id as string);
        if (!activityId || isNaN(activityId)) {
            return res.status(400).json({ status: false, message: 'Invalid activity ID' });
        }

        const {
            contact_id,
            activity_type_id,
            subject,
            notes,
            duration,
            outcome,
            activity_date
        } = req.body as UpdateActivityInput;

        // Check if activity exists
        const existing = await db
            .select()
            .from(activities)
            .where(eq(activities.id, activityId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Activity not found' });
        }

        const updateData: any = {};

        if (contact_id !== undefined) updateData.contactId = contact_id;
        if (activity_type_id !== undefined) updateData.activityTypeId = activity_type_id;
        if (subject !== undefined) updateData.subject = subject;
        if (notes !== undefined) updateData.notes = notes;
        if (duration !== undefined) updateData.duration = duration;
        if (outcome !== undefined) updateData.outcome = outcome;
        if (activity_date !== undefined) updateData.activityDate = new Date(activity_date);

        const [updatedActivity] = await db
            .update(activities)
            .set(updateData)
            .where(eq(activities.id, activityId))
            .returning();

        return res.json({
            status: true,
            message: 'Activity updated successfully',
            data: updatedActivity
        });
    } catch (error) {
        console.error('Error during activity update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const activityId = parseInt(req.params.id as string);
        if (!activityId || isNaN(activityId)) {
            return res.status(400).json({ status: false, message: 'Invalid activity ID' });
        }

        // Check if activity exists
        const existing = await db
            .select()
            .from(activities)
            .where(eq(activities.id, activityId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Activity not found' });
        }

        await db
            .delete(activities)
            .where(eq(activities.id, activityId));

        return res.json({
            status: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        console.error('Error during activity deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getActivityStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { performedBy, dateFrom, dateTo } = req.query;

        // Build filters
        const filters = [];

        if (performedBy) {
            filters.push(eq(activities.performedBy, parseInt(performedBy as string)));
        }

        if (dateFrom) {
            filters.push(gte(activities.activityDate, new Date(dateFrom as string)));
        }

        if (dateTo) {
            filters.push(lte(activities.activityDate, new Date(dateTo as string)));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get aggregated stats
        const [stats] = await db
            .select({
                totalActivities: sql<number>`cast(count(*) as integer)`,
                averageDuration: sql<number>`coalesce(avg(${activities.duration}), 0)`
            })
            .from(activities)
            .where(whereClause);

        // Get counts by type
        const byType = await db
            .select({
                name: activityTypes.name,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(activities)
            .leftJoin(activityTypes, eq(activities.activityTypeId, activityTypes.id))
            .where(whereClause)
            .groupBy(activityTypes.name);

        // Get counts by outcome
        const byOutcome = await db
            .select({
                outcome: activities.outcome,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(activities)
            .where(whereClause)
            .groupBy(activities.outcome);

        const byTypeMap: Record<string, number> = {};
        byType.forEach(item => {
            if (item.name) byTypeMap[item.name] = item.count;
        });

        const byOutcomeMap: Record<string, number> = {};
        byOutcome.forEach(item => {
            if (item.outcome) byOutcomeMap[item.outcome] = item.count;
        });

        return res.json({
            status: true,
            message: 'Activity statistics retrieved successfully',
            data: {
                totalActivities: stats.totalActivities,
                byType: byTypeMap,
                byOutcome: byOutcomeMap,
                averageDuration: parseFloat(stats.averageDuration.toString())
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
