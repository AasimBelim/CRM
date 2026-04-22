import { Response } from 'express';
import db from '../../db/db';
import { roles, users } from '../../db/schema';
import { eq, desc, and, SQL, is, like } from 'drizzle-orm';
import { strToMd5, verifyEmailFormat } from '../helpers/helpers';
import { AuthRequest } from '../types/express.types';
import { UserQueryParams, CreateUserInput, UpdateUserInput } from '../types/user.types';

export const getUsers = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { email, role, userName, status }: UserQueryParams = req.query;
        const whereConditions: SQL[] = [];
        if (email) whereConditions.push(eq(users.email, email));
        // Use partial match for userName if provided, normalize: lowercase and replace spaces with '-'
        if (userName) {
            const normalizedUserName = userName.toLowerCase().replace(/\s+/g, '-');
            whereConditions.push(like(users.userName, `%${normalizedUserName}%`));
        }
        if (role) whereConditions.push(eq(roles.roleName, role));
        if (status) whereConditions.push(eq(users.isActive, status === 'active'));

        const userData = await db.select({
            userId: users.id,
            userName: users.userName,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phoneNumber: users.phoneNumber,
            roleId: users.roleId,
            roleName: roles.roleName,
            isActive: users.isActive,
            createdAt: users.createdAt
        })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(users.id));

        if (!userData || userData.length <= 0) {
            return res.status(404).json({ status: false, message: 'No users found' });
        }

        return res.json({ status: true, message: 'User list retrieved successfully', userData });
    } catch (error) {
        console.error('Error during user retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export const getUser = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = parseInt(req.params.id as string) || req.userId;
        if (!userId) {
            return res.status(400).json({ status: false, message: 'User ID is required' });
        }

        const userData = await db.select({
            userId: users.id,
            userName: users.userName,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phoneNumber: users.phoneNumber,
            roleId: users.roleId,
            roleName: roles.roleName,
            isActive: users.isActive,
            createdAt: users.createdAt
        })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.id, userId))
            .limit(1);
        if (!userData || userData.length <= 0) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        return res.json({ status: true, message: 'User retrieved successfully', data: userData[0] });
    } catch (error) {
        console.error('Error during user retrieval:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export const addUser = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        // get user details from request body
        const { user_name, email, password, first_name, last_name, phone_number, status, role_id }: CreateUserInput = req.body;

        // validate input
        if (!user_name || !email || !password || !phone_number || !role_id) {
            return res.status(400).json({ status: false, message: 'Missing required fields' });
        }

        // check email format
        if (!verifyEmailFormat(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email format' });
        }

        // validate user details
        const userData = await db.select({
            id: users.id
        }).from(users).where(eq(users.email, email));
        if (userData.length > 0) {
            return res.status(409).json({ status: false, message: 'Email already in use' });
        }

        // parse status, it might come as string from frontend as "true" or "false" or "1"/"0"
        let isActive: boolean = true;
        if (typeof status === 'string') {
            isActive = (status.toLowerCase() === 'true' || status === '1');
        } else if (typeof status === 'boolean') {
            isActive = status;
        }

        // create new user in database
        const newUser = await db.insert(users).values({
            userName: user_name,
            email: email,
            password: strToMd5(password),
            firstName: first_name,
            lastName: last_name,
            phoneNumber: phone_number,
            roleId: role_id,
            isActive: isActive
        }).returning();

        if (newUser.length === 0) {
            return res.status(500).json({ status: false, message: 'Failed to create user' });
        }

        return res.json({ status: true, message: 'User added successfully', data: newUser });
    } catch (error) {
        console.error('Error during user addition:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export const updateUser = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = parseInt(req.params.id as string) || req.userId;
        if (!userId) {
            return res.status(400).json({ status: false, message: 'User ID is required' });
        }

        const { email, password, first_name, last_name, phone_number, status, role_id }: UpdateUserInput = req.body;
        const md5Password = (password && password !== "") ? strToMd5(password) : null;

        if (email) {
            if (!verifyEmailFormat(email)) {
                return res.status(400).json({ status: false, message: 'Invalid email format' });
            }
        }

        const updateData: any = {};
        if (email) updateData.email = email;
        if (md5Password) updateData.password = md5Password;
        if (first_name) updateData.firstName = first_name;
        if (last_name) updateData.lastName = last_name;
        if (phone_number) updateData.phoneNumber = phone_number;
        if (typeof status !== 'undefined') {
            if (typeof status === 'string') {
                updateData.isActive = (status.toLowerCase() === 'true' || status === '1');
            } else if (typeof status === 'boolean') {
                updateData.isActive = status;
            }
        }
        if (role_id) updateData.roleId = role_id;

        const updatedUser = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
        if (updatedUser.length === 0) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        return res.json({ status: true, message: 'User updated successfully', data: updatedUser[0] });
    } catch (error) {
        console.error('Error during user update:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export const deleteUser = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = parseInt(req.params.id as string);
        if (!userId) {
            return res.status(400).json({ status: false, message: 'User ID is required' });
        }

        const deletedCount = await db.delete(users).where(eq(users.id, userId)).returning().then(result => result.length);
        if (deletedCount === 0) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        return res.json({ status: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error during user deletion:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}