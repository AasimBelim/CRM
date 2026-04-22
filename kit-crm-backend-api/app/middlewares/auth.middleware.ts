import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.types';
import { JWTPayload } from '../types/auth.types';
import config from '../../config/config';

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: false, message: 'No token provided' });
        }

        jwt.verify(token, config.JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({ status: false, message: 'Failed to authenticate token' });
            }
            const payload = decoded as JWTPayload;
            req.userId = payload.userId;
            req.roleId = payload.roleId;
            req.userRole = payload.role;
            next();
        });
    } catch (error) {
        console.error('Error during token verification:', error);
        return res.status(500).json({ 
            status: false, 
            message: error instanceof Error ? error.message : 'Internal server error' 
        });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (req.userRole?.toLocaleLowerCase() === 'admin' && req.roleId === parseInt('3')) {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Access denied: Admins only' });
    }
};
