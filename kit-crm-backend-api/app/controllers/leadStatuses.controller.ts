import { Response } from 'express';
import db from '../../db/db';
import { leadStatuses, lostReasons } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import {
    CreateLeadStatusInput,
    UpdateLeadStatusInput,
    CreateLostReasonInput,
    UpdateLostReasonInput
} from '../types/lead.types';

// ============ LEAD STATUSES ============

export const getLeadStatuses = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const statusesData = await db
            .select()
            .from(leadStatuses)
            .orderBy(leadStatuses.name);
        
        return res.json({
            status: true,
            message: 'Lead statuses retrieved successfully',
            data: statusesData
        });
    } catch (error) {
        console.error('Error retrieving lead statuses:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getLeadStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const statusId = parseInt(req.params.id as string);
        
        if (!statusId || isNaN(statusId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid status ID is required'
            });
        }
        
        const [leadStatus] = await db
            .select()
            .from(leadStatuses)
            .where(eq(leadStatuses.id, statusId))
            .limit(1);
        
        if (!leadStatus) {
            return res.status(404).json({
                status: false,
                message: 'Lead status not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lead status retrieved successfully',
            data: leadStatus
        });
    } catch (error) {
        console.error('Error retrieving lead status:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createLeadStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { name }: CreateLeadStatusInput = req.body;
        
        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Name is required'
            });
        }
        
        // Check for duplicate
        const existing = await db
            .select({ id: leadStatuses.id })
            .from(leadStatuses)
            .where(eq(leadStatuses.name, name))
            .limit(1);
        
        if (existing.length > 0) {
            return res.status(409).json({
                status: false,
                message: 'Lead status with this name already exists'
            });
        }
        
        const [newStatus] = await db
            .insert(leadStatuses)
            .values({ name })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Lead status created successfully',
            data: newStatus
        });
    } catch (error) {
        console.error('Error creating lead status:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const statusId = parseInt(req.params.id as string);
        
        if (!statusId || isNaN(statusId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid status ID is required'
            });
        }
        
        const { name }: UpdateLeadStatusInput = req.body;
        
        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Name is required'
            });
        }
        
        // Check for duplicate
        const duplicate = await db
            .select({ id: leadStatuses.id })
            .from(leadStatuses)
            .where(eq(leadStatuses.name, name))
            .limit(1);
        
        if (duplicate.length > 0 && duplicate[0].id !== statusId) {
            return res.status(409).json({
                status: false,
                message: 'Lead status with this name already exists'
            });
        }
        
        const [updatedStatus] = await db
            .update(leadStatuses)
            .set({ name })
            .where(eq(leadStatuses.id, statusId))
            .returning();
        
        if (!updatedStatus) {
            return res.status(404).json({
                status: false,
                message: 'Lead status not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lead status updated successfully',
            data: updatedStatus
        });
    } catch (error) {
        console.error('Error updating lead status:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteLeadStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const statusId = parseInt(req.params.id as string);
        
        if (!statusId || isNaN(statusId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid status ID is required'
            });
        }
        
        // Note: This will fail if there are leads with this status due to foreign key constraint
        // In production, you might want to prevent deletion or soft delete
        const [deletedStatus] = await db
            .delete(leadStatuses)
            .where(eq(leadStatuses.id, statusId))
            .returning({ id: leadStatuses.id });
        
        if (!deletedStatus) {
            return res.status(404).json({
                status: false,
                message: 'Lead status not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lead status deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lead status:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

// ============ LOST REASONS ============

export const getLostReasons = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const reasonsData = await db
            .select()
            .from(lostReasons)
            .orderBy(lostReasons.reason);
        
        return res.json({
            status: true,
            message: 'Lost reasons retrieved successfully',
            data: reasonsData
        });
    } catch (error) {
        console.error('Error retrieving lost reasons:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getLostReason = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const reasonId = parseInt(req.params.id as string);
        
        if (!reasonId || isNaN(reasonId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid reason ID is required'
            });
        }
        
        const [lostReason] = await db
            .select()
            .from(lostReasons)
            .where(eq(lostReasons.id, reasonId))
            .limit(1);
        
        if (!lostReason) {
            return res.status(404).json({
                status: false,
                message: 'Lost reason not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lost reason retrieved successfully',
            data: lostReason
        });
    } catch (error) {
        console.error('Error retrieving lost reason:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createLostReason = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { reason }: CreateLostReasonInput = req.body;
        
        if (!reason) {
            return res.status(400).json({
                status: false,
                message: 'Reason is required'
            });
        }
        
        // Check for duplicate
        const existing = await db
            .select({ id: lostReasons.id })
            .from(lostReasons)
            .where(eq(lostReasons.reason, reason))
            .limit(1);
        
        if (existing.length > 0) {
            return res.status(409).json({
                status: false,
                message: 'Lost reason already exists'
            });
        }
        
        const [newReason] = await db
            .insert(lostReasons)
            .values({ reason })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Lost reason created successfully',
            data: newReason
        });
    } catch (error) {
        console.error('Error creating lost reason:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateLostReason = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const reasonId = parseInt(req.params.id as string);
        
        if (!reasonId || isNaN(reasonId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid reason ID is required'
            });
        }
        
        const { reason }: UpdateLostReasonInput = req.body;
        
        if (!reason) {
            return res.status(400).json({
                status: false,
                message: 'Reason is required'
            });
        }
        
        // Check for duplicate
        const duplicate = await db
            .select({ id: lostReasons.id })
            .from(lostReasons)
            .where(eq(lostReasons.reason, reason))
            .limit(1);
        
        if (duplicate.length > 0 && duplicate[0].id !== reasonId) {
            return res.status(409).json({
                status: false,
                message: 'Lost reason already exists'
            });
        }
        
        const [updatedReason] = await db
            .update(lostReasons)
            .set({ reason })
            .where(eq(lostReasons.id, reasonId))
            .returning();
        
        if (!updatedReason) {
            return res.status(404).json({
                status: false,
                message: 'Lost reason not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lost reason updated successfully',
            data: updatedReason
        });
    } catch (error) {
        console.error('Error updating lost reason:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteLostReason = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const reasonId = parseInt(req.params.id as string);
        
        if (!reasonId || isNaN(reasonId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid reason ID is required'
            });
        }
        
        const [deletedReason] = await db
            .delete(lostReasons)
            .where(eq(lostReasons.id, reasonId))
            .returning({ id: lostReasons.id });
        
        if (!deletedReason) {
            return res.status(404).json({
                status: false,
                message: 'Lost reason not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lost reason deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lost reason:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
