import { Response } from 'express';
import { getUser, updateUser } from './users.controller';
import { AuthRequest } from '../types/express.types';

export const getProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    return await getUser(req, res);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    return await updateUser(req, res);
};
