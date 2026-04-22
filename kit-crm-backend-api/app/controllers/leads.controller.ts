import { Response } from 'express';
import db from '../../db/db';
import { leads, companies, companyContacts, leadStatuses, users } from '../../db/schema';
import { eq, desc, asc, and, SQL, or, ilike, count, inArray } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import {
    LeadQueryParams,
    CreateLeadInput,
    UpdateLeadInput,
    BulkAssignLeadsInput
} from '../types/lead.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';
import { createStageHistoryRecord } from '../middlewares/stageTracking.middleware';

export const getLeads = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            companyId,
            contactId,
            leadStatusId,
            assignedTo,
            priority,
            tags,
            search,
            sortBy = 'createdAt',
            createdBy,
            sortOrder = 'desc'
        }: LeadQueryParams = req.query;
        
        const { page, limit, offset } = getPaginationParams(req.query);
        
        // Build where conditions
        const whereConditions: SQL[] = [];
        
        if (companyId) whereConditions.push(eq(leads.companyId, parseInt(companyId)));
        if (contactId) whereConditions.push(eq(leads.contactId, parseInt(contactId)));
        if (leadStatusId) whereConditions.push(eq(leads.leadStatusId, parseInt(leadStatusId)));
        if (priority) whereConditions.push(eq(leads.priority, priority));
        if (tags) whereConditions.push(ilike(leads.tags, `%${tags}%`));
        // If both createdBy and assignedTo are provided, use OR logic
        if (createdBy && assignedTo) {
            const createdById = parseInt(createdBy);
            const assignedToId = parseInt(assignedTo);
            const orCondition = or(
                eq(leads.createdBy, createdById),
                eq(leads.assignedTo, assignedToId)
            );
            if (orCondition) {
                whereConditions.push(orCondition);
            }
        } else if (createdBy) {
            whereConditions.push(eq(leads.createdBy, parseInt(createdBy)));
        } else if (assignedTo) {
            whereConditions.push(eq(leads.assignedTo, parseInt(assignedTo)));
        }
        
        // Global search across company name
        if (search) {
            whereConditions.push(ilike(companies.name, `%${search}%`));
        }
        
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        
        // Determine sort column and order
        const sortColumn = sortBy === 'updatedAt' ? leads.updatedAt :
                          sortBy === 'priority' ? leads.priority :
                          leads.createdAt;
        const orderFn = sortOrder === 'asc' ? asc : desc;
        
        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(leads)
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .where(whereClause);
        
        // Get leads with related data
        const leadsData = await db
            .select({
                id: leads.id,
                companyId: leads.companyId,
                companyName: companies.name,
                contactId: leads.contactId,
                contactName: companyContacts.name,
                leadStatusId: leads.leadStatusId,
                leadStatusName: leadStatuses.name,
                assignedTo: leads.assignedTo,
                assignedToName: users.userName,
                createdBy: leads.createdBy,
                priority: leads.priority,
                tags: leads.tags,
                qualifiedAt: leads.qualifiedAt,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(leadStatuses, eq(leads.leadStatusId, leadStatuses.id))
            .leftJoin(users, eq(leads.assignedTo, users.id))
            .where(whereClause)
            .orderBy(orderFn(sortColumn))
            .limit(limit)
            .offset(offset);
        
        const pagination = createPaginationMeta(page, limit, total);
        
        return res.json({
            status: true,
            message: 'Leads retrieved successfully',
            data: leadsData,
            pagination
        });
    } catch (error) {
        console.error('Error retrieving leads:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getLead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const leadId = parseInt(req.params.id as string);
        
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid lead ID is required'
            });
        }
        
        const leadData = await db
            .select({
                id: leads.id,
                companyId: leads.companyId,
                companyName: companies.name,
                contactId: leads.contactId,
                contactName: companyContacts.name,
                leadStatusId: leads.leadStatusId,
                leadStatusName: leadStatuses.name,
                assignedTo: leads.assignedTo,
                assignedToName: users.userName,
                createdBy: leads.createdBy,
                priority: leads.priority,
                tags: leads.tags,
                qualifiedAt: leads.qualifiedAt,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(leadStatuses, eq(leads.leadStatusId, leadStatuses.id))
            .leftJoin(users, eq(leads.assignedTo, users.id))
            .where(eq(leads.id, leadId))
            .limit(1);
        
        if (!leadData || leadData.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Lead not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lead retrieved successfully',
            data: leadData[0]
        });
    } catch (error) {
        console.error('Error retrieving lead:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createLead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            company_id,
            contact_id,
            lead_status_id,
            assigned_to,
            priority,
            tags
        }: CreateLeadInput = req.body;
        
            // Validate required fields
            if (!company_id || !lead_status_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Company ID and lead status ID are required'
                });
            }
        
        // Verify company exists
        const companyExists = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.id, company_id))
            .limit(1);
        
        if (companyExists.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Company not found'
            });
        }
        
        // Verify contact exists and belongs to this company if provided
        if (contact_id) {
            const contactExists = await db
                .select({ id: companyContacts.id, companyId: companyContacts.companyId })
                .from(companyContacts)
                .where(eq(companyContacts.id, contact_id))
                .limit(1);
            
            if (contactExists.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'Contact not found'
                });
            }
            
            if (contactExists[0].companyId !== company_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Contact does not belong to the specified company'
                });
            }
        }
        
        // Verify lead status exists
        const statusExists = await db
            .select({ id: leadStatuses.id })
            .from(leadStatuses)
            .where(eq(leadStatuses.id, lead_status_id))
            .limit(1);
        
        if (statusExists.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Lead status not found'
            });
        }
        
            // Verify assigned user exists if provided
            let assignedUserId = null;
            if (assigned_to !== undefined && assigned_to !== null) {
                const userExists = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.id, assigned_to))
                    .limit(1);
                
                if (userExists.length === 0) {
                    return res.status(404).json({
                        status: false,
                        message: 'Assigned user not found'
                    });
                }
                assignedUserId = assigned_to;
            }
        
        const [insertedLead] = await db
            .insert(leads)
            .values({
                companyId: company_id,
                contactId: contact_id || null,
                leadStatusId: lead_status_id,
                assignedTo: assignedUserId,
                createdBy: req.userId!,
                priority: priority || 'medium',
                tags: tags || null
            })
            .returning({ id: leads.id });

        // Fetch the full lead with joins (like getLead)
        const [newLead] = await db
            .select({
                id: leads.id,
                companyId: leads.companyId,
                companyName: companies.name,
                contactId: leads.contactId,
                contactName: companyContacts.name,
                leadStatusId: leads.leadStatusId,
                leadStatusName: leadStatuses.name,
                assignedTo: leads.assignedTo,
                assignedToName: users.userName,
                createdBy: leads.createdBy,
                priority: leads.priority,
                tags: leads.tags,
                qualifiedAt: leads.qualifiedAt,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(leadStatuses, eq(leads.leadStatusId, leadStatuses.id))
            .leftJoin(users, eq(leads.assignedTo, users.id))
            .where(eq(leads.id, insertedLead.id))
            .limit(1);

        return res.status(201).json({
            status: true,
            message: 'Lead created successfully',
            data: newLead
        });
    } catch (error) {
        console.error('Error creating lead:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateLead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const leadId = parseInt(req.params.id as string);
        
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid lead ID is required'
            });
        }
        
        const {
            contact_id,
            lead_status_id,
            assigned_to,
            priority,
            tags,
            qualified_at
        }: UpdateLeadInput = req.body;
        
        // Check if lead exists
        const existing = await db
            .select({ id: leads.id, companyId: leads.companyId })
            .from(leads)
            .where(eq(leads.id, leadId))
            .limit(1);
        
        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Lead not found'
            });
        }
        
        // Validate contact if provided
        if (contact_id) {
            const contactExists = await db
                .select({ id: companyContacts.id, companyId: companyContacts.companyId })
                .from(companyContacts)
                .where(eq(companyContacts.id, contact_id))
                .limit(1);
            
            if (contactExists.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'Contact not found'
                });
            }
            
            if (contactExists[0].companyId !== existing[0].companyId) {
                return res.status(400).json({
                    status: false,
                    message: 'Contact does not belong to the lead\'s company'
                });
            }
        }
        
        // Build update object
        const updateData: any = { updatedAt: new Date() };
        if (contact_id !== undefined) updateData.contactId = contact_id || null;
        if (lead_status_id !== undefined) updateData.leadStatusId = lead_status_id;
        if (assigned_to !== undefined) updateData.assignedTo = assigned_to;
        if (priority !== undefined) updateData.priority = priority;
        if (tags !== undefined) updateData.tags = tags || null;
        if (qualified_at !== undefined) {
            updateData.qualifiedAt = qualified_at ? new Date(qualified_at) : null;
        }
        
        const [updatedLead] = await db
            .update(leads)
            .set(updateData)
            .where(eq(leads.id, leadId))
            .returning();
        
        // Create stage history if status was changed
        if ((req as any).stageChange) {
            await createStageHistoryRecord((req as any).stageChange);
        }
        
        return res.json({
            status: true,
            message: 'Lead updated successfully',
            data: updatedLead
        });
    } catch (error) {
        console.error('Error updating lead:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteLead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const leadId = parseInt(req.params.id as string);
        
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid lead ID is required'
            });
        }
        
        // Hard delete (cascade will handle related opportunities)
        const [deletedLead] = await db
            .delete(leads)
            .where(eq(leads.id, leadId))
            .returning({ id: leads.id });
        
        if (!deletedLead) {
            return res.status(404).json({
                status: false,
                message: 'Lead not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lead:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkAssignLeads = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { lead_ids, assigned_to }: BulkAssignLeadsInput = req.body;
        
        if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Lead IDs array is required'
            });
        }
        
        if (!assigned_to) {
            return res.status(400).json({
                status: false,
                message: 'Assigned user ID is required'
            });
        }
        
        // Verify user exists
        const userExists = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, assigned_to))
            .limit(1);
        
        if (userExists.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Assigned user not found'
            });
        }
        
        // Update all leads
        await db
            .update(leads)
            .set({
                assignedTo: assigned_to,
                updatedAt: new Date()
            })
            .where(inArray(leads.id, lead_ids));
        
        return res.json({
            status: true,
            message: `${lead_ids.length} leads assigned successfully`,
            data: { count: lead_ids.length }
        });
    } catch (error) {
        console.error('Error bulk assigning leads:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
