import { Response } from 'express';
import { eq, and, desc, asc, sql, gte, lte, ilike, or, inArray } from 'drizzle-orm';
import db from '../../db/db';
import { opportunityStages, opportunities, leads, companies, companyContacts, lostReasons } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateOpportunityStageInput,
    UpdateOpportunityStageInput,
    OpportunityStageQueryParams,
    CreateOpportunityInput,
    UpdateOpportunityInput,
    OpportunityQueryParams,
    BulkAssignOpportunitiesInput
} from '../types/opportunity.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';
import { createStageHistoryRecord } from '../middlewares/stageTracking.middleware';

/* =========================
   OPPORTUNITY STAGES
========================= */

export const getOpportunityStages = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { isActive, sortBy = 'order', sortOrder = 'asc' } = req.query as OpportunityStageQueryParams;

        // Build filters
        const filters = [];
        if (isActive !== undefined) {
            filters.push(eq(opportunityStages.isActive, isActive === 'true'));
        }

        // Build query
        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(opportunityStages)
            .where(whereClause);

        // Get data with sorting
        const sortColumn = sortBy === 'name' ? opportunityStages.name :
            sortBy === 'probability' ? opportunityStages.probability :
                opportunityStages.order;

        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const stages = await db
            .select({
                id: opportunityStages.id,
                name: opportunityStages.name,
                probability: opportunityStages.probability,
                order: opportunityStages.order,
                isActive: opportunityStages.isActive,
                createdAt: opportunityStages.createdAt
            })
            .from(opportunityStages)
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Opportunity stages retrieved successfully',
            data: stages,
            pagination
        });
    } catch (error) {
        console.error('Error during opportunity stages retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getOpportunityStage = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const stageId = parseInt(req.params.id as string);
        if (!stageId || isNaN(stageId)) {
            return res.status(400).json({ status: false, message: 'Invalid stage ID' });
        }

        const stage = await db
            .select()
            .from(opportunityStages)
            .where(eq(opportunityStages.id, stageId))
            .limit(1);

        if (!stage || stage.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity stage not found' });
        }

        return res.json({
            status: true,
            message: 'Opportunity stage retrieved successfully',
            data: stage[0]
        });
    } catch (error) {
        console.error('Error during opportunity stage retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createOpportunityStage = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { name, probability, order, is_active = true } = req.body as CreateOpportunityStageInput;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ status: false, message: 'Stage name is required' });
        }

        if (order === undefined || order === null) {
            return res.status(400).json({ status: false, message: 'Order is required' });
        }

        // Validate probability if provided
        if (probability !== undefined && probability !== null && (probability < 0 || probability > 100)) {
            return res.status(400).json({ status: false, message: 'Probability must be between 0 and 100' });
        }

        // Check for duplicate name
        const existing = await db
            .select()
            .from(opportunityStages)
            .where(eq(opportunityStages.name, name.trim()))
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ status: false, message: 'Opportunity stage with this name already exists' });
        }

        const [newStage] = await db
            .insert(opportunityStages)
            .values({
                name: name.trim(),
                probability: probability ?? null,
                order,
                isActive: is_active
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Opportunity stage created successfully',
            data: newStage
        });
    } catch (error) {
        console.error('Error during opportunity stage creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateOpportunityStage = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const stageId = parseInt(req.params.id as string);
        if (!stageId || isNaN(stageId)) {
            return res.status(400).json({ status: false, message: 'Invalid stage ID' });
        }

        const { name, probability, order, is_active } = req.body as UpdateOpportunityStageInput;

        // Check if stage exists
        const existing = await db
            .select()
            .from(opportunityStages)
            .where(eq(opportunityStages.id, stageId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity stage not found' });
        }

        // Validate probability if provided
        if (probability !== undefined && probability !== null && (probability < 0 || probability > 100)) {
            return res.status(400).json({ status: false, message: 'Probability must be between 0 and 100' });
        }

        // Check for duplicate name if name is being updated
        if (name && name.trim() !== existing[0].name) {
            const duplicate = await db
                .select()
                .from(opportunityStages)
                .where(eq(opportunityStages.name, name.trim()))
                .limit(1);

            if (duplicate && duplicate.length > 0) {
                return res.status(409).json({ status: false, message: 'Opportunity stage with this name already exists' });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (probability !== undefined) updateData.probability = probability;
        if (order !== undefined) updateData.order = order;
        if (is_active !== undefined) updateData.isActive = is_active;

        const [updatedStage] = await db
            .update(opportunityStages)
            .set(updateData)
            .where(eq(opportunityStages.id, stageId))
            .returning();

        return res.json({
            status: true,
            message: 'Opportunity stage updated successfully',
            data: updatedStage
        });
    } catch (error) {
        console.error('Error during opportunity stage update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteOpportunityStage = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const stageId = parseInt(req.params.id as string);
        if (!stageId || isNaN(stageId)) {
            return res.status(400).json({ status: false, message: 'Invalid stage ID' });
        }

        // Check if stage exists
        const existing = await db
            .select()
            .from(opportunityStages)
            .where(eq(opportunityStages.id, stageId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity stage not found' });
        }

        // Soft delete by setting isActive to false
        await db
            .update(opportunityStages)
            .set({ isActive: false })
            .where(eq(opportunityStages.id, stageId));

        return res.json({
            status: true,
            message: 'Opportunity stage deleted successfully'
        });
    } catch (error) {
        console.error('Error during opportunity stage deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

/* =========================
   OPPORTUNITIES
========================= */

export const getOpportunities = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            leadId,
            stageId,
            minValue,
            maxValue,
            expectedCloseDateFrom,
            expectedCloseDateTo,
            search,
            createdBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as OpportunityQueryParams;

        // Build filters
        const filters = [];

        if (leadId) {
            filters.push(eq(opportunities.leadId, parseInt(leadId)));
        }

        if (stageId) {
            filters.push(eq(opportunities.stageId, parseInt(stageId)));
        }

        if (minValue) {
            filters.push(gte(opportunities.expectedValue, minValue));
        }

        if (maxValue) {
            filters.push(lte(opportunities.expectedValue, maxValue));
        }

        if (expectedCloseDateFrom) {
            filters.push(gte(opportunities.expectedCloseDate, new Date(expectedCloseDateFrom)));
        }

        if (expectedCloseDateTo) {
            filters.push(lte(opportunities.expectedCloseDate, new Date(expectedCloseDateTo)));
        }

        if (createdBy) {
            filters.push(eq(opportunities.createdBy, parseInt(createdBy)));
        }

        if (search) {
            filters.push(
                or(
                    ilike(opportunities.description, `%${search}%`),
                    ilike(opportunities.competitorInfo, `%${search}%`)
                )
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(opportunities)
            .where(whereClause);

        // Get data with joins
        const sortColumn = sortBy === 'expectedValue' ? opportunities.expectedValue :
            sortBy === 'expectedCloseDate' ? opportunities.expectedCloseDate :
                sortBy === 'probability' ? opportunities.probability :
                    opportunities.createdAt;

        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const opportunitiesData = await db
            .select({
                id: opportunities.id,
                createdBy: opportunities.createdBy,
                leadId: opportunities.leadId,
                stageId: opportunities.stageId,
                lostReasonId: opportunities.lostReasonId,
                expectedValue: opportunities.expectedValue,
                expectedCloseDate: opportunities.expectedCloseDate,
                actualCloseDate: opportunities.actualCloseDate,
                probability: opportunities.probability,
                description: opportunities.description,
                competitorInfo: opportunities.competitorInfo,
                createdAt: opportunities.createdAt,
                updatedAt: opportunities.updatedAt,
                stageName: opportunityStages.name,
                leadCompanyId: leads.companyId,
                leadCompanyName: companies.name,
                leadContactId: leads.contactId,
                leadContactName: companyContacts.name,
                lostReasonText: lostReasons.reason
            })
            .from(opportunities)
            .leftJoin(opportunityStages, eq(opportunities.stageId, opportunityStages.id))
            .leftJoin(leads, eq(opportunities.leadId, leads.id))
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(lostReasons, eq(opportunities.lostReasonId, lostReasons.id))
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Opportunities retrieved successfully',
            data: opportunitiesData,
            pagination
        });
    } catch (error) {
        console.error('Error during opportunities retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getOpportunity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const opportunityId = parseInt(req.params.id as string);
        if (!opportunityId || isNaN(opportunityId)) {
            return res.status(400).json({ status: false, message: 'Invalid opportunity ID' });
        }

        const opportunityData = await db
            .select({
                id: opportunities.id,
                createdBy: opportunities.createdBy,
                leadId: opportunities.leadId,
                stageId: opportunities.stageId,
                lostReasonId: opportunities.lostReasonId,
                expectedValue: opportunities.expectedValue,
                expectedCloseDate: opportunities.expectedCloseDate,
                actualCloseDate: opportunities.actualCloseDate,
                probability: opportunities.probability,
                description: opportunities.description,
                competitorInfo: opportunities.competitorInfo,
                createdAt: opportunities.createdAt,
                updatedAt: opportunities.updatedAt,
                stageName: opportunityStages.name,
                stageProbability: opportunityStages.probability,
                leadCompanyId: leads.companyId,
                leadCompanyName: companies.name,
                leadContactId: leads.contactId,
                leadContactName: companyContacts.name,
                lostReasonText: lostReasons.reason
            })
            .from(opportunities)
            .leftJoin(opportunityStages, eq(opportunities.stageId, opportunityStages.id))
            .leftJoin(leads, eq(opportunities.leadId, leads.id))
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(lostReasons, eq(opportunities.lostReasonId, lostReasons.id))
            .where(eq(opportunities.id, opportunityId))
            .limit(1);

        if (!opportunityData || opportunityData.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity not found' });
        }

        return res.json({
            status: true,
            message: 'Opportunity retrieved successfully',
            data: opportunityData[0]
        });
    } catch (error) {
        console.error('Error during opportunity retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createOpportunity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            lead_id,
            stage_id,
            expected_value,
            expected_close_date,
            probability,
            description,
            competitor_info
        } = req.body as CreateOpportunityInput;

        // Validate required fields
        if (!lead_id) {
            return res.status(400).json({ status: false, message: 'Lead ID is required' });
        }

        if (!stage_id) {
            return res.status(400).json({ status: false, message: 'Stage ID is required' });
        }

        // Verify lead exists
        const lead = await db
            .select()
            .from(leads)
            .where(eq(leads.id, lead_id))
            .limit(1);

        if (!lead || lead.length === 0) {
            return res.status(404).json({ status: false, message: 'Lead not found' });
        }

        // Verify stage exists
        const stage = await db
            .select()
            .from(opportunityStages)
            .where(eq(opportunityStages.id, stage_id))
            .limit(1);

        if (!stage || stage.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity stage not found' });
        }

        // Use stage probability if not provided
        const finalProbability = probability !== undefined ? probability : stage[0].probability;

        const [newOpportunity] = await db
            .insert(opportunities)
            .values({
                createdBy: req.userId as number,
                leadId: lead_id,
                stageId: stage_id,
                expectedValue: expected_value ? expected_value.toString() : null,
                expectedCloseDate: expected_close_date ? new Date(expected_close_date) : null,
                probability: finalProbability,
                description: description || null,
                competitorInfo: competitor_info || null
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Opportunity created successfully',
            data: newOpportunity
        });
    } catch (error) {
        console.error('Error during opportunity creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateOpportunity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const opportunityId = parseInt(req.params.id as string);
        if (!opportunityId || isNaN(opportunityId)) {
            return res.status(400).json({ status: false, message: 'Invalid opportunity ID' });
        }

        const {
            stage_id,
            lost_reason_id,
            expected_value,
            expected_close_date,
            actual_close_date,
            probability,
            description,
            competitor_info
        } = req.body as UpdateOpportunityInput;

        // Check if opportunity exists
        const existing = await db
            .select()
            .from(opportunities)
            .where(eq(opportunities.id, opportunityId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity not found' });
        }

        // Verify stage if provided
        if (stage_id) {
            const stage = await db
                .select()
                .from(opportunityStages)
                .where(eq(opportunityStages.id, stage_id))
                .limit(1);

            if (!stage || stage.length === 0) {
                return res.status(404).json({ status: false, message: 'Opportunity stage not found' });
            }
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (stage_id !== undefined) updateData.stageId = stage_id;
        if (lost_reason_id !== undefined) updateData.lostReasonId = lost_reason_id;
        if (expected_value !== undefined) updateData.expectedValue = expected_value ? expected_value.toString() : null;
        if (expected_close_date !== undefined) updateData.expectedCloseDate = expected_close_date ? new Date(expected_close_date) : null;
        if (actual_close_date !== undefined) updateData.actualCloseDate = actual_close_date ? new Date(actual_close_date) : null;
        if (probability !== undefined) updateData.probability = probability;
        if (description !== undefined) updateData.description = description;
        if (competitor_info !== undefined) updateData.competitorInfo = competitor_info;

        const [updatedOpportunity] = await db
            .update(opportunities)
            .set(updateData)
            .where(eq(opportunities.id, opportunityId))
            .returning();

        // Create stage history if stage was changed
        if ((req as any).stageChange) {
            await createStageHistoryRecord((req as any).stageChange);
        }

        return res.json({
            status: true,
            message: 'Opportunity updated successfully',
            data: updatedOpportunity
        });
    } catch (error) {
        console.error('Error during opportunity update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteOpportunity = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const opportunityId = parseInt(req.params.id as string);
        if (!opportunityId || isNaN(opportunityId)) {
            return res.status(400).json({ status: false, message: 'Invalid opportunity ID' });
        }

        // Check if opportunity exists
        const existing = await db
            .select()
            .from(opportunities)
            .where(eq(opportunities.id, opportunityId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity not found' });
        }

        // Hard delete (cascade will handle related records)
        await db
            .delete(opportunities)
            .where(eq(opportunities.id, opportunityId));

        return res.json({
            status: true,
            message: 'Opportunity deleted successfully'
        });
    } catch (error) {
        console.error('Error during opportunity deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkAssignOpportunities = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { opportunity_ids, lead_id, stage_id } = req.body as BulkAssignOpportunitiesInput;

        if (!opportunity_ids || !Array.isArray(opportunity_ids) || opportunity_ids.length === 0) {
            return res.status(400).json({ status: false, message: 'Opportunity IDs array is required' });
        }

        if (!lead_id && !stage_id) {
            return res.status(400).json({ status: false, message: 'At least one field (lead_id or stage_id) is required' });
        }

        const updateData: any = { updatedAt: new Date() };
        if (lead_id) updateData.leadId = lead_id;
        if (stage_id) updateData.stageId = stage_id;

        await db
            .update(opportunities)
            .set(updateData)
            .where(inArray(opportunities.id, opportunity_ids));

        return res.json({
            status: true,
            message: `${opportunity_ids.length} opportunities updated successfully`
        });
    } catch (error) {
        console.error('Error during bulk assign:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
