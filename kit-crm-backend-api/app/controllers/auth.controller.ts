import { Request, Response } from 'express';
import db from '../../db/db';
import { roles, users } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SignInInput, JWTPayload } from '../types/auth.types';
import config from '../../config/config';

const strToMd5 = (str: string): string => {
    return crypto.createHash('md5').update(str).digest('hex');
}

export const signIn = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password }: SignInInput = req.body;

        // validate input
        if (!email || !password) {
            return res.status(400).json({ status: false, message: 'Missing required fields' });
        }

        // check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email format' });
        }

        // validate user details
        const userData = await db.select({
            id: users.id,
            password: users.password,
            firstName: users.firstName,
            lastName: users.lastName,
            userName: users.userName,
            roleId: users.roleId,
            roleName: roles.roleName,
            phoneNumber: users.phoneNumber
        })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(and(eq(users.email, email), eq(users.isActive, true)))
            .limit(1);

        if (!userData || userData.length <= 0) {
            return res.status(409).json({ status: false, message: 'User is not existing' });
        }

        if (userData[0].password !== strToMd5(password)) {
            return res.status(401).json({ status: false, message: 'Incorrect password' });
        }

        // generate JWT token
        const tokenExpiry = Math.floor(Date.now() / 1000) + (2 * 60 * 60); // 2 hours from now
        const payload: JWTPayload = {
            userId: userData[0].id,
            email: email,
            firstName: userData[0].firstName,
            lastName: userData[0].lastName,
            userName: userData[0].userName,
            roleId: userData[0].roleId,
            role: userData[0].roleName,
            phoneNumber: userData[0].phoneNumber
        };

        const token = jwt.sign(payload,
            config.JWT_SECRET_KEY,
            { expiresIn: tokenExpiry }
        );

        return res.json({ status: true, message: 'User signed in successfully', data: { ...payload, token } });
    } catch (error) {
        console.error('Error during sign-in:', error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}