import { Response } from 'express';
import db from '../../db/db';
import { companyContacts, companies } from '../../db/schema';
import { eq, desc, asc, and, SQL, or, ilike, count } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import {
    ContactQueryParams,
    CreateContactInput,
    UpdateContactInput
} from '../types/contact.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';
import { verifyEmailFormat } from '../helpers/helpers';

export const getContacts = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            companyId,
            name,
            email,
            isPrimary,
            isActive,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        }: ContactQueryParams = req.query;
        
        const { page, limit, offset } = getPaginationParams(req.query);
        
        // Build where conditions
        const whereConditions: SQL[] = [];
        
        if (companyId) whereConditions.push(eq(companyContacts.companyId, parseInt(companyId)));
        if (name) whereConditions.push(ilike(companyContacts.name, `%${name}%`));
        if (email) whereConditions.push(ilike(companyContacts.email, `%${email}%`));
        if (isPrimary !== undefined) whereConditions.push(eq(companyContacts.isPrimary, isPrimary === 'true'));
        if (isActive !== undefined) whereConditions.push(eq(companyContacts.isActive, isActive === 'true'));
        
        // Global search
        if (search) {
            whereConditions.push(
                or(
                    ilike(companyContacts.name, `%${search}%`),
                    ilike(companyContacts.email, `%${search}%`),
                    ilike(companyContacts.designation, `%${search}%`)
                )!
            );
        }
        
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        
        // Determine sort column and order
        const sortColumn = sortBy === 'name' ? companyContacts.name :
                          sortBy === 'email' ? companyContacts.email :
                          companyContacts.createdAt;
        const orderFn = sortOrder === 'asc' ? asc : desc;
        
        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(companyContacts)
            .where(whereClause);
        
        // Get contacts with company info
        const contactsData = await db
            .select({
                id: companyContacts.id,
                companyId: companyContacts.companyId,
                companyName: companies.name,
                name: companyContacts.name,
                email: companyContacts.email,
                phone: companyContacts.phone,
                linkedIn: companyContacts.linkedIn,
                designation: companyContacts.designation,
                isPrimary: companyContacts.isPrimary,
                isActive: companyContacts.isActive,
                createdAt: companyContacts.createdAt,
                updatedAt: companyContacts.updatedAt,
            })
            .from(companyContacts)
            .leftJoin(companies, eq(companyContacts.companyId, companies.id))
            .where(whereClause)
            .orderBy(orderFn(sortColumn))
            .limit(limit)
            .offset(offset);
        
        const pagination = createPaginationMeta(page, limit, total);
        
        return res.json({
            status: true,
            message: 'Contacts retrieved successfully',
            data: contactsData,
            pagination
        });
    } catch (error) {
        console.error('Error retrieving contacts:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getContact = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const contactId = parseInt(req.params.id as string);
        
        if (!contactId || isNaN(contactId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid contact ID is required'
            });
        }
        
        const contactData = await db
            .select({
                id: companyContacts.id,
                companyId: companyContacts.companyId,
                companyName: companies.name,
                name: companyContacts.name,
                email: companyContacts.email,
                phone: companyContacts.phone,
                linkedIn: companyContacts.linkedIn,
                designation: companyContacts.designation,
                isPrimary: companyContacts.isPrimary,
                isActive: companyContacts.isActive,
                createdAt: companyContacts.createdAt,
                updatedAt: companyContacts.updatedAt,
            })
            .from(companyContacts)
            .leftJoin(companies, eq(companyContacts.companyId, companies.id))
            .where(eq(companyContacts.id, contactId))
            .limit(1);
        
        if (!contactData || contactData.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Contact not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Contact retrieved successfully',
            data: contactData[0]
        });
    } catch (error) {
        console.error('Error retrieving contact:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getContactsByCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = parseInt(req.params.companyId as string);
        
        if (!companyId || isNaN(companyId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid company ID is required'
            });
        }
        
        // Verify company exists
        const companyExists = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);
        
        if (companyExists.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Company not found'
            });
        }
        
        const contactsData = await db
            .select({
                id: companyContacts.id,
                companyId: companyContacts.companyId,
                name: companyContacts.name,
                email: companyContacts.email,
                phone: companyContacts.phone,
                linkedIn: companyContacts.linkedIn,
                designation: companyContacts.designation,
                isPrimary: companyContacts.isPrimary,
                isActive: companyContacts.isActive,
                createdAt: companyContacts.createdAt,
                updatedAt: companyContacts.updatedAt,
            })
            .from(companyContacts)
            .where(
                and(
                    eq(companyContacts.companyId, companyId),
                    eq(companyContacts.isActive, true)
                )
            )
            .orderBy(desc(companyContacts.isPrimary), desc(companyContacts.createdAt));
        
        return res.json({
            status: true,
            message: 'Company contacts retrieved successfully',
            data: contactsData
        });
    } catch (error) {
        console.error('Error retrieving company contacts:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createContact = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            company_id,
            name,
            email,
            phone,
            linkedin,
            designation,
            is_primary
        }: CreateContactInput = req.body;
        
        // Validate required fields
        if (!company_id || !name || !email) {
            return res.status(400).json({
                status: false,
                message: 'Company ID, name, and email are required'
            });
        }
        
        // Validate email format
        if (!verifyEmailFormat(email)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid email format'
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
        
        // If setting as primary, unset other primary contacts for this company
        if (is_primary) {
            await db
                .update(companyContacts)
                .set({ isPrimary: false })
                .where(eq(companyContacts.companyId, company_id));
        }
        
        const [newContact] = await db
            .insert(companyContacts)
            .values({
                companyId: company_id,
                name,
                email,
                phone: phone || null,
                linkedIn: linkedin || null,
                designation: designation || null,
                isPrimary: is_primary || false,
                isActive: true
            })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Contact created successfully',
            data: newContact
        });
    } catch (error) {
        console.error('Error creating contact:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateContact = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const contactId = parseInt(req.params.id as string);
        
        if (!contactId || isNaN(contactId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid contact ID is required'
            });
        }
        
        const {
            name,
            email,
            phone,
            linkedin,
            designation,
            is_primary,
            is_active
        }: UpdateContactInput = req.body;
        
        // Validate email format if provided
        if (email && !verifyEmailFormat(email)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid email format'
            });
        }
        
        // Check if contact exists
        const existing = await db
            .select({ id: companyContacts.id, companyId: companyContacts.companyId })
            .from(companyContacts)
            .where(eq(companyContacts.id, contactId))
            .limit(1);
        
        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Contact not found'
            });
        }
        
        // If setting as primary, unset other primary contacts for this company
        if (is_primary === true) {
            await db
                .update(companyContacts)
                .set({ isPrimary: false })
                .where(eq(companyContacts.companyId, existing[0].companyId));
        }
        
        // Build update object
        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone || null;
        if (linkedin !== undefined) updateData.linkedIn = linkedin || null;
        if (designation !== undefined) updateData.designation = designation || null;
        if (is_primary !== undefined) updateData.isPrimary = is_primary;
        if (is_active !== undefined) updateData.isActive = is_active;
        
        const [updatedContact] = await db
            .update(companyContacts)
            .set(updateData)
            .where(eq(companyContacts.id, contactId))
            .returning();
        
        return res.json({
            status: true,
            message: 'Contact updated successfully',
            data: updatedContact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteContact = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const contactId = parseInt(req.params.id as string);
        
        if (!contactId || isNaN(contactId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid contact ID is required'
            });
        }
        
        // Soft delete
        const [deletedContact] = await db
            .update(companyContacts)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(companyContacts.id, contactId))
            .returning({ id: companyContacts.id });
        
        if (!deletedContact) {
            return res.status(404).json({
                status: false,
                message: 'Contact not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
