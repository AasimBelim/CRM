import { Response } from 'express';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import db from '../../db/db';
import { stageHistory, users, leadStatuses, opportunityStages } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateStageHistoryInput,
    StageHistoryQueryParams
} from '../types/stageHistory.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

export const getStageHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            entityType,
            entityId,
            fromStageId,
            toStageId,
            changedBy,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as StageHistoryQueryParams;

        // Build filters
        const filters = [];

        if (entityType) {
            filters.push(eq(stageHistory.entityType, entityType));
        }

        if (entityId) {
            filters.push(eq(stageHistory.entityId, parseInt(entityId)));
        }

        if (fromStageId) {
            filters.push(eq(stageHistory.fromStageId, parseInt(fromStageId)));
        }

        if (toStageId) {
            filters.push(eq(stageHistory.toStageId, parseInt(toStageId)));
        }

        if (changedBy) {
            filters.push(eq(stageHistory.changedBy, parseInt(changedBy)));
        }

        if (dateFrom) {
            filters.push(gte(stageHistory.createdAt, new Date(dateFrom)));
        }

        if (dateTo) {
            filters.push(lte(stageHistory.createdAt, new Date(dateTo)));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(stageHistory)
            .where(whereClause);

        // Get data with joins
        const orderClause = sortOrder === 'desc' ? desc(stageHistory.createdAt) : asc(stageHistory.createdAt);

        const historyData = await db
            .select({
                id: stageHistory.id,
                entityType: stageHistory.entityType,
                entityId: stageHistory.entityId,
                fromStageId: stageHistory.fromStageId,
                toStageId: stageHistory.toStageId,
                changedBy: stageHistory.changedBy,
                notes: stageHistory.notes,
                createdAt: stageHistory.createdAt,
                changedByName: users.userName,
                changedByEmail: users.email,
                // For opportunities, join opportunityStages
                fromOpportunityStageName: sql<string>`(SELECT name FROM ${opportunityStages} WHERE id = ${stageHistory.fromStageId})`,
                toOpportunityStageName: sql<string>`(SELECT name FROM ${opportunityStages} WHERE id = ${stageHistory.toStageId})`,
                // For leads, join leadStatuses
                fromLeadStatusName: sql<string>`(SELECT name FROM ${leadStatuses} WHERE id = ${stageHistory.fromStageId})`,
                toLeadStatusName: sql<string>`(SELECT name FROM ${leadStatuses} WHERE id = ${stageHistory.toStageId})`
            })
            .from(stageHistory)
            .leftJoin(users, eq(stageHistory.changedBy, users.id))
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        // Transform the data to include correct stage names based on entity type
        const transformedData = historyData.map(record => ({
            id: record.id,
            entityType: record.entityType,
            entityId: record.entityId,
            fromStageId: record.fromStageId,
            toStageId: record.toStageId,
            changedBy: record.changedBy,
            notes: record.notes,
            createdAt: record.createdAt,
            changedByName: record.changedByName,
            changedByEmail: record.changedByEmail,
            fromStageName: record.entityType === 'opportunity' 
                ? record.fromOpportunityStageName 
                : record.fromLeadStatusName,
            toStageName: record.entityType === 'opportunity'
                ? record.toOpportunityStageName
                : record.toLeadStatusName
        }));

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Stage history retrieved successfully',
            data: transformedData,
            pagination
        });
    } catch (error) {
        console.error('Error during stage history retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getSingleStageHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const historyId = parseInt(req.params.id as string);
        if (!historyId || isNaN(historyId)) {
            return res.status(400).json({ status: false, message: 'Invalid history ID' });
        }

        const historyData = await db
            .select({
                id: stageHistory.id,
                entityType: stageHistory.entityType,
                entityId: stageHistory.entityId,
                fromStageId: stageHistory.fromStageId,
                toStageId: stageHistory.toStageId,
                changedBy: stageHistory.changedBy,
                notes: stageHistory.notes,
                createdAt: stageHistory.createdAt,
                changedByName: users.userName,
                changedByEmail: users.email,
                fromOpportunityStageName: sql<string>`(SELECT name FROM ${opportunityStages} WHERE id = ${stageHistory.fromStageId})`,
                toOpportunityStageName: sql<string>`(SELECT name FROM ${opportunityStages} WHERE id = ${stageHistory.toStageId})`,
                fromLeadStatusName: sql<string>`(SELECT name FROM ${leadStatuses} WHERE id = ${stageHistory.fromStageId})`,
                toLeadStatusName: sql<string>`(SELECT name FROM ${leadStatuses} WHERE id = ${stageHistory.toStageId})`
            })
            .from(stageHistory)
            .leftJoin(users, eq(stageHistory.changedBy, users.id))
            .where(eq(stageHistory.id, historyId))
            .limit(1);

        if (!historyData || historyData.length === 0) {
            return res.status(404).json({ status: false, message: 'Stage history not found' });
        }

        const record = historyData[0];
        const transformedData = {
            id: record.id,
            entityType: record.entityType,
            entityId: record.entityId,
            fromStageId: record.fromStageId,
            toStageId: record.toStageId,
            changedBy: record.changedBy,
            notes: record.notes,
            createdAt: record.createdAt,
            changedByName: record.changedByName,
            changedByEmail: record.changedByEmail,
            fromStageName: record.entityType === 'opportunity'
                ? record.fromOpportunityStageName
                : record.fromLeadStatusName,
            toStageName: record.entityType === 'opportunity'
                ? record.toOpportunityStageName
                : record.toLeadStatusName
        };

        return res.json({
            status: true,
            message: 'Stage history retrieved successfully',
            data: transformedData
        });
    } catch (error) {
        console.error('Error during stage history retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createStageHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            entity_type,
            entity_id,
            from_stage_id,
            to_stage_id,
            notes: historyNotes
        } = req.body as CreateStageHistoryInput;

        // Validate required fields
        if (!entity_type || !['lead', 'opportunity'].includes(entity_type)) {
            return res.status(400).json({ status: false, message: 'Valid entity type is required (lead or opportunity)' });
        }

        if (!entity_id) {
            return res.status(400).json({ status: false, message: 'Entity ID is required' });
        }

        if (!to_stage_id) {
            return res.status(400).json({ status: false, message: 'To stage ID is required' });
        }

        const userId = req.userId!;

        const [newHistory] = await db
            .insert(stageHistory)
            .values({
                entityType: entity_type,
                entityId: entity_id,
                fromStageId: from_stage_id || null,
                toStageId: to_stage_id,
                changedBy: userId,
                notes: historyNotes || null
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Stage history created successfully',
            data: newHistory
        });
    } catch (error) {
        console.error('Error during stage history creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getStageHistoryStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { entityType, entityId } = req.query;

        // Build filters
        const filters = [];

        if (entityType) {
            if (!['lead', 'opportunity'].includes(entityType as string)) {
                return res.status(400).json({ status: false, message: 'Valid entity type is required (lead or opportunity)' });
            }
            filters.push(eq(stageHistory.entityType, entityType as 'lead' | 'opportunity'));
        }

        if (entityId) {
            filters.push(eq(stageHistory.entityId, parseInt(entityId as string)));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total transitions
        const [stats] = await db
            .select({
                totalTransitions: sql<number>`cast(count(*) as integer)`
            })
            .from(stageHistory)
            .where(whereClause);

        // Get stage-wise count for opportunities
        const opportunityStageStats = await db
            .select({
                stageName: opportunityStages.name,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(stageHistory)
            .leftJoin(opportunityStages, eq(stageHistory.toStageId, opportunityStages.id))
            .where(
                filters.length > 0 
                    ? and(...filters, eq(stageHistory.entityType, 'opportunity'))
                    : eq(stageHistory.entityType, 'opportunity')
            )
            .groupBy(opportunityStages.name);

        // Get stage-wise count for leads
        const leadStatusStats = await db
            .select({
                stageName: leadStatuses.name,
                count: sql<number>`cast(count(*) as integer)`
            })
            .from(stageHistory)
            .leftJoin(leadStatuses, eq(stageHistory.toStageId, leadStatuses.id))
            .where(
                filters.length > 0
                    ? and(...filters, eq(stageHistory.entityType, 'lead'))
                    : eq(stageHistory.entityType, 'lead')
            )
            .groupBy(leadStatuses.name);

        const byStage: Record<string, number> = {};
        
        opportunityStageStats.forEach(item => {
            if (item.stageName) byStage[item.stageName] = item.count;
        });

        leadStatusStats.forEach(item => {
            if (item.stageName) byStage[item.stageName] = item.count;
        });

        return res.json({
            status: true,
            message: 'Stage history statistics retrieved successfully',
            data: {
                totalTransitions: stats.totalTransitions,
                byStage
            }
        });
    } catch (error) {
        console.error('Error during stage history stats retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
