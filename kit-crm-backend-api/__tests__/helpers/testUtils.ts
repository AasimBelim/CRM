import request from 'supertest';
import app from '../../server';

export interface TestUser {
    id: number;
    email: string;
    token: string;
    roleId: number;
}

let testToken: string | null = null;
let testUserId: number | null = null;

/**
 * Login and get authentication token for testing
 */
export const getAuthToken = async (): Promise<string> => {
    if (testToken) {
        return testToken;
    }

    // Try to login with test credentials
    const response = await request(app)
        .post('/api/v1/auth/sign-in')
        .send({
            email: 'test@example.com',
            password: 'test123'
        });

    if (response.status === 200 && response.body.data && response.body.data.token) {
        testToken = response.body.data.token;
        testUserId = response.body.data.userId;
        return testToken as string;
    }

    // If login fails, create a test user (this assumes you have a seed or can create users)
    throw new Error('Test user not found. Please seed the database with test data.');
};

/**
 * Get test user ID
 */
export const getTestUserId = (): number => {
    if (!testUserId) {
        throw new Error('Test user ID not available. Call getAuthToken() first.');
    }
    return testUserId;
};

/**
 * Reset test token (useful for testing auth failures)
 */
export const resetAuthToken = (): void => {
    testToken = null;
    testUserId = null;
};

/**
 * Create authenticated request
 */
export const authenticatedRequest = async (method: 'get' | 'post' | 'put' | 'delete', url: string) => {
    const token = await getAuthToken();
    const req = request(app)[method](url);
    return req.set('Authorization', `Bearer ${token}`);
};

/**
 * Create unauthenticated request (for testing auth failures)
 */
export const unauthenticatedRequest = (method: 'get' | 'post' | 'put' | 'delete', url: string) => {
    return request(app)[method](url);
};

/**
 * Generate random email
 */
export const generateEmail = (): string => {
    return `test.${Date.now()}.${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate random company domain
 */
export const generateDomain = (): string => {
    return `company-${Date.now()}-${Math.random().toString(36).substring(7)}.com`;
};

/**
 * Sleep utility for async operations
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export default {
    getAuthToken,
    getTestUserId,
    resetAuthToken,
    authenticatedRequest,
    unauthenticatedRequest,
    generateEmail,
    generateDomain,
    sleep
};
