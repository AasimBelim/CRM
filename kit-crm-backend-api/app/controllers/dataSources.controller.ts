import { Response } from 'express';
import db from '../../db/db';
import { dataSources } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';
import {
    CreateDataSourceInput,
    UpdateDataSourceInput
} from '../types/dataSource.types';

// Get all data sources (usually for dropdowns, no pagination needed)
export const getDataSources = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { isActive } = req.query;
        
        const whereClause = isActive !== undefined 
            ? eq(dataSources.isActive, isActive === 'true')
            : undefined;
        
        const dataSourcesData = await db
            .select()
            .from(dataSources)
            .where(whereClause)
            .orderBy(dataSources.name);
        
        return res.json({
            status: true,
            message: 'Data sources retrieved successfully',
            data: dataSourcesData
        });
    } catch (error) {
        console.error('Error retrieving data sources:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const getDataSource = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dataSourceId = parseInt(req.params.id as string);
        
        if (!dataSourceId || isNaN(dataSourceId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid data source ID is required'
            });
        }
        
        const [dataSource] = await db
            .select()
            .from(dataSources)
            .where(eq(dataSources.id, dataSourceId))
            .limit(1);
        
        if (!dataSource) {
            return res.status(404).json({
                status: false,
                message: 'Data source not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Data source retrieved successfully',
            data: dataSource
        });
    } catch (error) {
        console.error('Error retrieving data source:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const createDataSource = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { name, is_active }: CreateDataSourceInput = req.body;
        
        if (!name) {
            return res.status(400).json({
                status: false,
                message: 'Name is required'
            });
        }
        
        // Check for duplicate name
        const existing = await db
            .select({ id: dataSources.id })
            .from(dataSources)
            .where(eq(dataSources.name, name))
            .limit(1);
        
        if (existing.length > 0) {
            return res.status(409).json({
                status: false,
                message: 'Data source with this name already exists'
            });
        }
        
        const [newDataSource] = await db
            .insert(dataSources)
            .values({
                name,
                isActive: is_active !== undefined ? is_active : true
            })
            .returning();
        
        return res.status(201).json({
            status: true,
            message: 'Data source created successfully',
            data: newDataSource
        });
    } catch (error) {
        console.error('Error creating data source:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const updateDataSource = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dataSourceId = parseInt(req.params.id as string);
        
        if (!dataSourceId || isNaN(dataSourceId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid data source ID is required'
            });
        }
        
        const { name, is_active }: UpdateDataSourceInput = req.body;
        
        // Check if exists
        const existing = await db
            .select({ id: dataSources.id })
            .from(dataSources)
            .where(eq(dataSources.id, dataSourceId))
            .limit(1);
        
        if (existing.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Data source not found'
            });
        }
        
        // Check for duplicate name if updating name
        if (name) {
            const duplicate = await db
                .select({ id: dataSources.id })
                .from(dataSources)
                .where(eq(dataSources.name, name))
                .limit(1);
            
            if (duplicate.length > 0 && duplicate[0].id !== dataSourceId) {
                return res.status(409).json({
                    status: false,
                    message: 'Data source with this name already exists'
                });
            }
        }
        
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (is_active !== undefined) updateData.isActive = is_active;
        
        const [updatedDataSource] = await db
            .update(dataSources)
            .set(updateData)
            .where(eq(dataSources.id, dataSourceId))
            .returning();
        
        return res.json({
            status: true,
            message: 'Data source updated successfully',
            data: updatedDataSource
        });
    } catch (error) {
        console.error('Error updating data source:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};

export const deleteDataSource = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const dataSourceId = parseInt(req.params.id as string);
        
        if (!dataSourceId || isNaN(dataSourceId)) {
            return res.status(400).json({
                status: false,
                message: 'Valid data source ID is required'
            });
        }
        
        // Soft delete - set isActive to false
        const [deletedDataSource] = await db
            .update(dataSources)
            .set({ isActive: false })
            .where(eq(dataSources.id, dataSourceId))
            .returning({ id: dataSources.id });
        
        if (!deletedDataSource) {
            return res.status(404).json({
                status: false,
                message: 'Data source not found'
            });
        }
        
        return res.json({
            status: true,
            message: 'Data source deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting data source:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
