import { Response } from 'express';
import { eq, and, desc, asc, sql, gte, lte, ilike, or, inArray } from 'drizzle-orm';
import db from '../../db/db';
import { deals, opportunities, leads, companies, companyContacts, users, lostReasons } from '../../db/schema';
import { AuthRequest } from '../types/express.types';
import {
    CreateDealInput,
    UpdateDealInput,
    DealQueryParams,
    BulkUpdateDealsInput
} from '../types/deal.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

/* =========================
   DEALS
========================= */

export const getDeals = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const {
            opportunityId,
            status,
            minValue,
            maxValue,
            createdBy,
            closedDateFrom,
            closedDateTo,
            contractStartFrom,
            contractStartTo,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query as DealQueryParams;

        // Build filters
        const filters = [];

        if (opportunityId) {
            filters.push(eq(deals.opportunityId, parseInt(opportunityId)));
        }

        if (status) {
            filters.push(eq(deals.status, status));
        }

        if (minValue) {
            filters.push(gte(deals.dealValue, minValue));
        }

        if (maxValue) {
            filters.push(lte(deals.dealValue, maxValue));
        }

        if (createdBy) {
            filters.push(eq(deals.createdBy, parseInt(createdBy)));
        }

        if (closedDateFrom) {
            filters.push(gte(deals.closedDate, new Date(closedDateFrom)));
        }

        if (closedDateTo) {
            filters.push(lte(deals.closedDate, new Date(closedDateTo)));
        }

        if (contractStartFrom) {
            filters.push(gte(deals.contractStartDate, new Date(contractStartFrom)));
        }

        if (contractStartTo) {
            filters.push(lte(deals.contractStartDate, new Date(contractStartTo)));
        }

        if (search) {
            filters.push(
                or(
                    ilike(deals.paymentTerms, `%${search}%`)
                )
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(deals)
            .where(whereClause);

        // Get data with joins
        const sortColumn = sortBy === 'dealValue' ? deals.dealValue :
            sortBy === 'status' ? deals.status :
                sortBy === 'closedDate' ? deals.closedDate :
                    deals.createdAt;

        const orderClause = sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const dealsData = await db
            .select({
                id: deals.id,
                opportunityId: deals.opportunityId,
                createdBy: deals.createdBy,
                dealValue: deals.dealValue,
                status: deals.status,
                lostReasonId: deals.lostReasonId,
                contractStartDate: deals.contractStartDate,
                contractEndDate: deals.contractEndDate,
                paymentTerms: deals.paymentTerms,
                closedDate: deals.closedDate,
                createdAt: deals.createdAt,
                updatedAt: deals.updatedAt,
                createdByName: users.userName,
                opportunityLeadId: opportunities.leadId,
                opportunityExpectedValue: opportunities.expectedValue,
                leadCompanyId: leads.companyId,
                leadContactId: leads.contactId,
                companyName: companies.name,
                contactName: companyContacts.name,
                lostReasonText: lostReasons.reason
            })
            .from(deals)
            .leftJoin(users, eq(deals.createdBy, users.id))
            .leftJoin(opportunities, eq(deals.opportunityId, opportunities.id))
            .leftJoin(leads, eq(opportunities.leadId, leads.id))
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(lostReasons, eq(deals.lostReasonId, lostReasons.id))
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        const pagination = createPaginationMeta(page, limit, count);

        return res.json({
            status: true,
            message: 'Deals retrieved successfully',
            data: dealsData,
            pagination
        });
    } catch (error) {
        console.error('Error during deals retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getDeal = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dealId = parseInt(req.params.id as string);
        if (!dealId || isNaN(dealId)) {
            return res.status(400).json({ status: false, message: 'Invalid deal ID' });
        }

        const dealData = await db
            .select({
                id: deals.id,
                opportunityId: deals.opportunityId,
                createdBy: deals.createdBy,
                dealValue: deals.dealValue,
                status: deals.status,
                lostReasonId: deals.lostReasonId,
                contractStartDate: deals.contractStartDate,
                contractEndDate: deals.contractEndDate,
                paymentTerms: deals.paymentTerms,
                closedDate: deals.closedDate,
                createdAt: deals.createdAt,
                updatedAt: deals.updatedAt,
                createdByName: users.userName,
                opportunityLeadId: opportunities.leadId,
                opportunityStageId: opportunities.stageId,
                opportunityExpectedValue: opportunities.expectedValue,
                opportunityDescription: opportunities.description,
                leadCompanyId: leads.companyId,
                leadContactId: leads.contactId,
                companyName: companies.name,
                companyIndustry: companies.industry,
                contactName: companyContacts.name,
                contactEmail: companyContacts.email,
                lostReasonText: lostReasons.reason
            })
            .from(deals)
            .leftJoin(users, eq(deals.createdBy, users.id))
            .leftJoin(opportunities, eq(deals.opportunityId, opportunities.id))
            .leftJoin(leads, eq(opportunities.leadId, leads.id))
            .leftJoin(companies, eq(leads.companyId, companies.id))
            .leftJoin(companyContacts, eq(leads.contactId, companyContacts.id))
            .leftJoin(lostReasons, eq(deals.lostReasonId, lostReasons.id))
            .where(eq(deals.id, dealId))
            .limit(1);

        if (!dealData || dealData.length === 0) {
            return res.status(404).json({ status: false, message: 'Deal not found' });
        }

        return res.json({
            status: true,
            message: 'Deal retrieved successfully',
            data: dealData[0]
        });
    } catch (error) {
        console.error('Error during deal retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createDeal = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            opportunity_id,
            deal_value,
            status = 'pending',
            contract_start_date,
            contract_end_date,
            payment_terms,
            closed_date
        } = req.body as CreateDealInput;

        // Validate required fields
        if (!opportunity_id) {
            return res.status(400).json({ status: false, message: 'Opportunity ID is required' });
        }

        if (!deal_value || deal_value <= 0) {
            return res.status(400).json({ status: false, message: 'Valid deal value is required' });
        }

        // Verify opportunity exists
        const opportunity = await db
            .select()
            .from(opportunities)
            .where(eq(opportunities.id, opportunity_id))
            .limit(1);

        if (!opportunity || opportunity.length === 0) {
            return res.status(404).json({ status: false, message: 'Opportunity not found' });
        }

        const userId = req.userId!;

        const [newDeal] = await db
            .insert(deals)
            .values({
                opportunityId: opportunity_id,
                createdBy: userId,
                dealValue: deal_value.toString(),
                status,
                contractStartDate: contract_start_date ? new Date(contract_start_date) : null,
                contractEndDate: contract_end_date ? new Date(contract_end_date) : null,
                paymentTerms: payment_terms || null,
                closedDate: closed_date ? new Date(closed_date) : null
            })
            .returning();

        return res.status(201).json({
            status: true,
            message: 'Deal created successfully',
            data: newDeal
        });
    } catch (error) {
        console.error('Error during deal creation:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateDeal = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dealId = parseInt(req.params.id as string);
        if (!dealId || isNaN(dealId)) {
            return res.status(400).json({ status: false, message: 'Invalid deal ID' });
        }

        const {
            deal_value,
            status,
            lost_reason_id,
            contract_start_date,
            contract_end_date,
            payment_terms,
            closed_date
        } = req.body as UpdateDealInput;

        // Check if deal exists
        const existing = await db
            .select()
            .from(deals)
            .where(eq(deals.id, dealId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Deal not found' });
        }

        // Validate deal value if provided
        if (deal_value !== undefined && deal_value <= 0) {
            return res.status(400).json({ status: false, message: 'Deal value must be greater than 0' });
        }

        const updateData: any = {
            updatedAt: new Date()
        };

        if (deal_value !== undefined) updateData.dealValue = deal_value.toString();
        if (status !== undefined) updateData.status = status;
        if (lost_reason_id !== undefined) updateData.lostReasonId = lost_reason_id;
        if (contract_start_date !== undefined) updateData.contractStartDate = contract_start_date ? new Date(contract_start_date) : null;
        if (contract_end_date !== undefined) updateData.contractEndDate = contract_end_date ? new Date(contract_end_date) : null;
        if (payment_terms !== undefined) updateData.paymentTerms = payment_terms;
        if (closed_date !== undefined) updateData.closedDate = closed_date ? new Date(closed_date) : null;

        const [updatedDeal] = await db
            .update(deals)
            .set(updateData)
            .where(eq(deals.id, dealId))
            .returning();

        return res.json({
            status: true,
            message: 'Deal updated successfully',
            data: updatedDeal
        });
    } catch (error) {
        console.error('Error during deal update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteDeal = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dealId = parseInt(req.params.id as string);
        if (!dealId || isNaN(dealId)) {
            return res.status(400).json({ status: false, message: 'Invalid deal ID' });
        }

        // Check if deal exists
        const existing = await db
            .select()
            .from(deals)
            .where(eq(deals.id, dealId))
            .limit(1);

        if (!existing || existing.length === 0) {
            return res.status(404).json({ status: false, message: 'Deal not found' });
        }

        // Hard delete
        await db
            .delete(deals)
            .where(eq(deals.id, dealId));

        return res.json({
            status: true,
            message: 'Deal deleted successfully'
        });
    } catch (error) {
        console.error('Error during deal deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkUpdateDeals = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { deal_ids, status, lost_reason_id } = req.body as BulkUpdateDealsInput;

        if (!deal_ids || !Array.isArray(deal_ids) || deal_ids.length === 0) {
            return res.status(400).json({ status: false, message: 'Deal IDs array is required' });
        }

        if (!status && lost_reason_id === undefined) {
            return res.status(400).json({ status: false, message: 'At least one field (status or lost_reason_id) is required' });
        }

        const updateData: any = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (lost_reason_id !== undefined) updateData.lostReasonId = lost_reason_id;

        await db
            .update(deals)
            .set(updateData)
            .where(inArray(deals.id, deal_ids));

        return res.json({
            status: true,
            message: `${deal_ids.length} deals updated successfully`
        });
    } catch (error) {
        console.error('Error during bulk update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getDealStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { createdBy, dateFrom, dateTo } = req.query;

        // Build filters
        const filters = [];

        if (createdBy) {
            filters.push(eq(deals.createdBy, parseInt(createdBy as string)));
        }

        if (dateFrom) {
            filters.push(gte(deals.createdAt, new Date(dateFrom as string)));
        }

        if (dateTo) {
            filters.push(lte(deals.createdAt, new Date(dateTo as string)));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get aggregated stats
        const [stats] = await db
            .select({
                totalDeals: sql<number>`cast(count(*) as integer)`,
                totalValue: sql<string>`coalesce(sum(${deals.dealValue}), 0)`,
                wonDeals: sql<number>`cast(count(*) filter (where ${deals.status} = 'won') as integer)`,
                wonValue: sql<string>`coalesce(sum(${deals.dealValue}) filter (where ${deals.status} = 'won'), 0)`,
                lostDeals: sql<number>`cast(count(*) filter (where ${deals.status} = 'lost') as integer)`,
                lostValue: sql<string>`coalesce(sum(${deals.dealValue}) filter (where ${deals.status} = 'lost'), 0)`,
                pendingDeals: sql<number>`cast(count(*) filter (where ${deals.status} = 'pending') as integer)`,
                pendingValue: sql<string>`coalesce(sum(${deals.dealValue}) filter (where ${deals.status} = 'pending'), 0)`,
                averageDealValue: sql<string>`coalesce(avg(${deals.dealValue}), 0)`
            })
            .from(deals)
            .where(whereClause);

        return res.json({
            status: true,
            message: 'Deal statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error during stats retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
