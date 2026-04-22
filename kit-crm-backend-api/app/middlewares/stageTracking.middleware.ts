import { Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import db from '../../db/db';
import { stageHistory, opportunities, leads } from '../../db/schema';
import { AuthRequest } from '../types/express.types';

/**
 * Middleware to track opportunity stage changes
 * This should be placed BEFORE the updateOpportunity controller
 */
export const trackOpportunityStageChange = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const opportunityId = parseInt(req.params.id as string);
        const { stage_id } = req.body;

        // Only proceed if stage_id is being updated
        if (!stage_id || isNaN(opportunityId)) {
            return next();
        }

        // Get current opportunity to compare stage
        const existing = await db
            .select({ id: opportunities.id, stageId: opportunities.stageId })
            .from(opportunities)
            .where(eq(opportunities.id, opportunityId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return next(); // Let the controller handle the 404
        }

        const oldStageId = existing[0].stageId;
        const newStageId = parseInt(stage_id);

        // Only create history if stage is actually changing
        if (oldStageId !== newStageId) {
            // Store the stage change info in request for controller to use after update
            (req as any).stageChange = {
                entityType: 'opportunity' as const,
                entityId: opportunityId,
                fromStageId: oldStageId,
                toStageId: newStageId,
                changedBy: req.userId!
            };
        }

        next();
    } catch (error) {
        console.error('Error in trackOpportunityStageChange middleware:', error);
        next(); // Don't block the request if stage tracking fails
    }
};

/**
 * Middleware to track lead status changes
 * This should be placed BEFORE the updateLead controller
 */
export const trackLeadStatusChange = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const leadId = parseInt(req.params.id as string);
        const { lead_status_id } = req.body;

        // Only proceed if lead_status_id is being updated
        if (!lead_status_id || isNaN(leadId)) {
            return next();
        }

        // Get current lead to compare status
        const existing = await db
            .select({ id: leads.id, leadStatusId: leads.leadStatusId })
            .from(leads)
            .where(eq(leads.id, leadId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return next(); // Let the controller handle the 404
        }

        const oldStatusId = existing[0].leadStatusId;
        const newStatusId = parseInt(lead_status_id);

        // Only create history if status is actually changing
        if (oldStatusId !== newStatusId) {
            // Store the status change info in request for controller to use after update
            (req as any).stageChange = {
                entityType: 'lead' as const,
                entityId: leadId,
                fromStageId: oldStatusId,
                toStageId: newStatusId,
                changedBy: req.userId!
            };
        }

        next();
    } catch (error) {
        console.error('Error in trackLeadStatusChange middleware:', error);
        next(); // Don't block the request if stage tracking fails
    }
};

/**
 * Helper function to create stage history record
 * Call this AFTER a successful update in the controller
 */
export const createStageHistoryRecord = async (stageChangeData: {
    entityType: 'lead' | 'opportunity';
    entityId: number;
    fromStageId: number;
    toStageId: number;
    changedBy: number;
    notes?: string;
}): Promise<void> => {
    try {
        await db.insert(stageHistory).values({
            entityType: stageChangeData.entityType,
            entityId: stageChangeData.entityId,
            fromStageId: stageChangeData.fromStageId,
            toStageId: stageChangeData.toStageId,
            changedBy: stageChangeData.changedBy,
            notes: stageChangeData.notes || null
        });
    } catch (error) {
        console.error('Error creating stage history record:', error);
        // Don't throw - we don't want to fail the update if history creation fails
    }
};
