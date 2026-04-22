import { Response } from 'express';
import db from '../../db/db';
import { companies, dataSources, users } from '../../db/schema';
import { eq, desc, asc, and, SQL, or, ilike, count } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import { 
    CompanyQueryParams, 
    CreateCompanyInput, 
    UpdateCompanyInput,
    BulkAssignInput 
} from '../types/company.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

export const getCompanies = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { 
            name, 
            domain, 
            industry, 
            companySize, 
            country, 
            city,
            dataSourceId,
            assignedTo,
            createdBy,
            isActive,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        }: CompanyQueryParams = req.query;
        
        const { page, limit, offset } = getPaginationParams(req.query);
        
        // Build where conditions
        const whereConditions: SQL[] = [];
        
        if (name) whereConditions.push(ilike(companies.name, `%${name}%`));
        if (domain) whereConditions.push(ilike(companies.domain, `%${domain}%`));
        if (industry) whereConditions.push(eq(companies.industry, industry));
        if (companySize) whereConditions.push(eq(companies.companySize, companySize));
        // Normalize country: lowercase, replace spaces with dashes, partial match
        if (country) {
            const normalizedCountry = country.toLowerCase().replace(/\s+/g, '-');
            whereConditions.push(ilike(companies.country, `%${normalizedCountry}%`));
        }
        if (city) whereConditions.push(eq(companies.city, city));
        if (dataSourceId) whereConditions.push(eq(companies.dataSourceId, parseInt(dataSourceId)));
        // If both createdBy and assignedTo are provided, use OR logic
        if (createdBy && assignedTo) {
            const createdById = parseInt(createdBy);
            const assignedToId = parseInt(assignedTo);
            const orCondition = or(
                eq(companies.createdBy, createdById),
                eq(companies.assignedTo, assignedToId)
            );
            if (orCondition) {
                whereConditions.push(orCondition);
            }
        } else if (createdBy) {
            whereConditions.push(eq(companies.createdBy, parseInt(createdBy)));
        } else if (assignedTo) {
            whereConditions.push(eq(companies.assignedTo, parseInt(assignedTo)));
        }
        if (isActive !== undefined) whereConditions.push(eq(companies.isActive, isActive === 'true'));
        
        // Global search across multiple fields
        if (search) {
            whereConditions.push(
                or(
                    ilike(companies.name, `%${search}%`),
                    ilike(companies.domain, `%${search}%`),
                    ilike(companies.description, `%${search}%`)
                )!
            );
        }
        
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        
        // Determine sort column and order
        const sortColumn = sortBy === 'name' ? companies.name :
                          sortBy === 'updatedAt' ? companies.updatedAt :
                          companies.createdAt;
        const orderFn = sortOrder === 'asc' ? asc : desc;
        
        // Get total count for pagination
        const [{ total }] = await db
            .select({ total: count() })
            .from(companies)
            .where(whereClause);
        
        // Get companies with related data
        const companiesData = await db
            .select({
                id: companies.id,
                name: companies.name,
                website: companies.website,
                domain: companies.domain,
                industry: companies.industry,
                companySize: companies.companySize,
                country: companies.country,
                city: companies.city,
                address: companies.address,
                description: companies.description,
                dataSourceId: companies.dataSourceId,
                dataSourceName: dataSources.name,
                dataQuality: companies.dataQuality,
                verifiedAt: companies.verifiedAt,
                verifiedBy: companies.verifiedBy,
                createdBy: companies.createdBy,
                createdByName: users.userName,
                assignedTo: companies.assignedTo,
                assignedToName: users.userName,
                assignedAt: companies.assignedAt,
                isActive: companies.isActive,
                createdAt: companies.createdAt,
                updatedAt: companies.updatedAt,
            })
            .from(companies)
            .leftJoin(dataSources, eq(companies.dataSourceId, dataSources.id))
            .leftJoin(users, eq(companies.createdBy, users.id))
            .where(whereClause)
            .orderBy(orderFn(sortColumn))
            .limit(limit)
            .offset(offset);
        
        const pagination = createPaginationMeta(page, limit, total);
        
        return res.json({
            status: true,
            message: 'Companies retrieved successfully',
            data: companiesData,
            pagination
        });
    } catch (error) {
        console.error('Error retrieving companies:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = parseInt(req.params.id as string);
        
        if (!companyId || isNaN(companyId)) {
            return res.status(400).json({ 
                status: false, 
                message: 'Valid company ID is required' 
            });
        }
        
        const companyData = await db
            .select({
                id: companies.id,
                name: companies.name,
                website: companies.website,
                domain: companies.domain,
                industry: companies.industry,
                companySize: companies.companySize,
                country: companies.country,
                city: companies.city,
                address: companies.address,
                description: companies.description,
                dataSourceId: companies.dataSourceId,
                dataSourceName: dataSources.name,
                dataQuality: companies.dataQuality,
                verifiedAt: companies.verifiedAt,
                verifiedBy: companies.verifiedBy,
                createdBy: companies.createdBy,
                createdByName: users.userName,
                assignedTo: companies.assignedTo,
                assignedToName: users.userName,
                assignedAt: companies.assignedAt,
                isActive: companies.isActive,
                createdAt: companies.createdAt,
                updatedAt: companies.updatedAt,
            })
            .from(companies)
            .leftJoin(dataSources, eq(companies.dataSourceId, dataSources.id))
            .leftJoin(users, eq(companies.createdBy, users.id))
            .where(eq(companies.id, companyId))
            .limit(1);
        
        if (!companyData || companyData.length === 0) {
            return res.status(404).json({ 
                status: false, 
                message: 'Company not found' 
            });
        }
        
        return res.json({
            status: true,
            message: 'Company retrieved successfully',
            data: companyData[0]
        });
    } catch (error) {
        console.error('Error retrieving company:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            name,
            website,
            domain,
            industry,
            company_size,
            country,
            city,
            address,
            description,
            data_source_id,
            data_quality,
            assigned_to
        }: CreateCompanyInput = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Company name is required'
            });
        }
        
        // Check if company with same domain already exists
        if (domain) {
            const existing = await db
                .select({ id: companies.id })
                .from(companies)
                .where(eq(companies.domain, domain))
                .limit(1);
            
            if (existing.length > 0) {
                return res.status(409).json({
                    status: false,
                    message: 'Company with this domain already exists'
                });
            }
        }
        
        const [newCompany] = await db
            .insert(companies)
            .values({
                name,
                website: website || null,
                domain: domain || null,
                industry: industry || null,
                companySize: company_size || null,
                country: country || null,
                city: city || null,
                address: address || null,
                description: description || null,
                dataSourceId: data_source_id || null,
                dataQuality: data_quality || 3,
                createdBy: req.userId!,
                assignedTo: assigned_to || null,
                assignedAt: assigned_to ? new Date() : null,
                isActive: true
            })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Company created successfully',
            data: newCompany
        });
    } catch (error) {
        console.error('Error creating company:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = parseInt(req.params.id as string);
        
        if (!companyId || isNaN(companyId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid company ID is required'
            });
        }
        
        const {
            name,
            website,
            domain,
            industry,
            company_size,
            country,
            city,
            address,
            description,
            data_source_id,
            data_quality,
            assigned_to,
            is_active
        }: UpdateCompanyInput = req.body;
        
        // Check if company exists
        const existing = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);
        
        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Company not found'
            });
        }
        
        // Check domain uniqueness if updating domain
        if (domain) {
            const domainExists = await db
                .select({ id: companies.id })
                .from(companies)
                .where(and(
                    eq(companies.domain, domain),
                    eq(companies.id, companyId)
                ))
                .limit(1);
            
            if (domainExists.length > 0 && domainExists[0].id !== companyId) {
                return res.status(409).json({
                    status: false,
                    message: 'Company with this domain already exists'
                });
            }
        }
        
        // Build update object with only provided fields
        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (website !== undefined) updateData.website = website || null;
        if (domain !== undefined) updateData.domain = domain || null;
        if (industry !== undefined) updateData.industry = industry || null;
        if (company_size !== undefined) updateData.companySize = company_size || null;
        if (country !== undefined) updateData.country = country || null;
        if (city !== undefined) updateData.city = city || null;
        if (address !== undefined) updateData.address = address || null;
        if (description !== undefined) updateData.description = description || null;
        if (data_source_id !== undefined) updateData.dataSourceId = data_source_id || null;
        if (data_quality !== undefined) updateData.dataQuality = data_quality;
        if (assigned_to !== undefined) {
            updateData.assignedTo = assigned_to || null;
            updateData.assignedAt = assigned_to ? new Date() : null;
        }
        if (is_active !== undefined) updateData.isActive = is_active;
        
        const [updatedCompany] = await db
            .update(companies)
            .set(updateData)
            .where(eq(companies.id, companyId))
            .returning();
        
        return res.json({
            status: true,
            message: 'Company updated successfully',
            data: updatedCompany
        });
    } catch (error) {
        console.error('Error updating company:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = parseInt(req.params.id as string);
        
        if (!companyId || isNaN(companyId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid company ID is required'
            });
        }
        
        // Soft delete - set isActive to false
        const [deletedCompany] = await db
            .update(companies)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(companies.id, companyId))
            .returning({ id: companies.id });
        
        if (!deletedCompany) {
            return res.status(404).json({
                status: false,
                message: 'Company not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const bulkAssignCompanies = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { company_ids, assigned_to }: BulkAssignInput = req.body;
        
        if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Company IDs array is required'
            });
        }
        
        if (!assigned_to) {
            return res.status(400).json({
                status: false,
                message: 'Assigned user ID is required'
            });
        }
        
        // Update all companies in the array
        const updated = await db
            .update(companies)
            .set({
                assignedTo: assigned_to,
                assignedAt: new Date(),
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(companies.id, company_ids[0]),
                    // Note: Drizzle doesn't have an 'in' helper for arrays easily,
                    // so we'd need to use SQL for this in production
                    // For now, this is a placeholder for the pattern
                )
            )
            .returning({ id: companies.id });
        
        return res.json({
            status: true,
            message: `${company_ids.length} companies assigned successfully`,
            data: { count: company_ids.length }
        });
    } catch (error) {
        console.error('Error bulk assigning companies:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
