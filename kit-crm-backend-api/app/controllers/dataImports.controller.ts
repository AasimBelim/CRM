import { Response } from 'express';
import db from '../../db/db';
import { dataImports, users } from '../../db/schema';
import { eq, desc, and, SQL, gte, lte, count } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import {
    DataImportQueryParams,
    CreateDataImportInput,
    UpdateDataImportInput
} from '../types/dataSource.types';
import { getPaginationParams, createPaginationMeta } from '../helpers/pagination.helper';

export const getDataImports = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            importedBy,
            status,
            dateFrom,
            dateTo
        }: DataImportQueryParams = req.query;
        
        const { page, limit, offset } = getPaginationParams(req.query);
        
        // Build where conditions
        const whereConditions: SQL[] = [];
        
        if (importedBy) whereConditions.push(eq(dataImports.importedBy, parseInt(importedBy)));
        if (status) whereConditions.push(eq(dataImports.status, status));
        if (dateFrom) whereConditions.push(gte(dataImports.createdAt, new Date(dateFrom)));
        if (dateTo) whereConditions.push(lte(dataImports.createdAt, new Date(dateTo)));
        
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        
        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(dataImports)
            .where(whereClause);
        
        // Get imports with user info
        const importsData = await db
            .select({
                id: dataImports.id,
                fileName: dataImports.fileName,
                importedBy: dataImports.importedBy,
                importedByName: users.userName,
                totalRecords: dataImports.totalRecords,
                successfulRecords: dataImports.successfulRecords,
                failedRecords: dataImports.failedRecords,
                status: dataImports.status,
                errorLog: dataImports.errorLog,
                createdAt: dataImports.createdAt,
            })
            .from(dataImports)
            .leftJoin(users, eq(dataImports.importedBy, users.id))
            .where(whereClause)
            .orderBy(desc(dataImports.createdAt))
            .limit(limit)
            .offset(offset);
        
        const pagination = createPaginationMeta(page, limit, total);
        
        return res.json({
            status: true,
            message: 'Data imports retrieved successfully',
            data: importsData,
            pagination
        });
    } catch (error) {
        console.error('Error retrieving data imports:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getDataImport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const importId = parseInt(req.params.id as string);
        
        if (!importId || isNaN(importId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid import ID is required'
            });
        }
        
        const [importData] = await db
            .select({
                id: dataImports.id,
                fileName: dataImports.fileName,
                importedBy: dataImports.importedBy,
                importedByName: users.userName,
                totalRecords: dataImports.totalRecords,
                successfulRecords: dataImports.successfulRecords,
                failedRecords: dataImports.failedRecords,
                status: dataImports.status,
                errorLog: dataImports.errorLog,
                createdAt: dataImports.createdAt,
            })
            .from(dataImports)
            .leftJoin(users, eq(dataImports.importedBy, users.id))
            .where(eq(dataImports.id, importId))
            .limit(1);
        
        if (!importData) {
            return res.status(404).json({
                status: false,
                message: 'Data import not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Data import retrieved successfully',
            data: importData
        });
    } catch (error) {
        console.error('Error retrieving data import:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createDataImport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { file_name, total_records }: CreateDataImportInput = req.body;
        
        if (!total_records || total_records < 0) {
            return res.status(400).json({
                status: false,
                message: 'Valid total records count is required'
            });
        }
        
        const [newImport] = await db
            .insert(dataImports)
            .values({
                fileName: file_name || null,
                importedBy: req.userId!,
                totalRecords: total_records,
                successfulRecords: 0,
                failedRecords: 0,
                status: 'processing'
            })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Data import created successfully',
            data: newImport
        });
    } catch (error) {
        console.error('Error creating data import:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateDataImport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const importId = parseInt(req.params.id as string);
        
        if (!importId || isNaN(importId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid import ID is required'
            });
        }
        
        const {
            status,
            successful_records,
            failed_records,
            error_log
        }: UpdateDataImportInput = req.body;
        
        // Check if exists
        const existing = await db
            .select({ id: dataImports.id })
            .from(dataImports)
            .where(eq(dataImports.id, importId))
            .limit(1);
        
        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Data import not found'
            });
        }
        
        // Build update object
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (successful_records !== undefined) updateData.successfulRecords = successful_records;
        if (failed_records !== undefined) updateData.failedRecords = failed_records;
        if (error_log !== undefined) updateData.errorLog = error_log || null;
        
        const [updatedImport] = await db
            .update(dataImports)
            .set(updateData)
            .where(eq(dataImports.id, importId))
            .returning();
        
        return res.json({
            status: true,
            message: 'Data import updated successfully',
            data: updatedImport
        });
    } catch (error) {
        console.error('Error updating data import:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
