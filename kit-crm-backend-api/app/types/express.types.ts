import { Request } from 'express';

// Extended Express Request with custom properties
export interface AuthRequest extends Request {
  userId?: number;
  roleId?: number;
  userRole?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  userData?: T;
}

export interface ErrorResponse {
  status: false;
  message: string;
}
