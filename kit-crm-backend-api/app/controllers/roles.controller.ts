import { Response } from 'express';
import db from '../../db/db';
import { roles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types/express.types';

export const getRoles = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const allRoles = await db.select({
            roleId: roles.id,
            roleName: roles.roleName
        }).from(roles);
        
        if (!allRoles || allRoles.length <= 0) {
            return res.status(404).json({ status: false, message: 'No roles found' });
        }

        return res.json({ status: true, message: 'Roles fetched successfully', data: allRoles });
    } catch (error) {
        console.error('Error during roles fetching:', error);
        return res.status(500).json({ 
            status: false, 
            message: error instanceof Error ? error.message : 'Internal server error' 
        });
    }
};

export const getRole = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const roleId = parseInt(req.params.id as string);
        if (!roleId) {
            return res.status(400).json({ status: false, message: 'Role ID is required' });
        }

        const role = await db.select({
            roleId: roles.id,
            roleName: roles.roleName
        }).from(roles).where(eq(roles.id, roleId)).limit(1);
        
        if (!role || role.length <= 0) {
            return res.status(404).json({ status: false, message: 'Role not found' });
        }

        return res.json({ status: true, message: 'Role fetched successfully', data: role[0] });
    } catch (error) {
        console.error('Error during role fetching:', error);
        return res.status(500).json({ 
            status: false, 
            message: error instanceof Error ? error.message : 'Internal server error' 
        });
    }
};
