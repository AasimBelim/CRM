import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { getAuthToken, generateDomain, authenticatedRequest, unauthenticatedRequest } from '../helpers/testUtils';

describe('Companies API', () => {
    let authToken: string;
    let createdCompanyId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    describe('POST /api/v1/companies - Create Company', () => {
        test('should create a new company with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Company Ltd',
                    website: 'https://testcompany.com',
                    domain: generateDomain(),
                    industry: 'Technology',
                    company_size: '51-200',
                    country: 'USA',
                    city: 'San Francisco',
                    description: 'A test company'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.message).toContain('created successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('Test Company Ltd');

            createdCompanyId = response.body.data.id;
        });

        test('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/companies')
                .send({
                    name: 'Test Company'
                });

            expect(response.status).toBe(401);
        });

        test('should fail without company name', async () => {
            const response = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    website: 'https://testcompany.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toContain('name is required');
        });

        test('should fail with duplicate domain', async () => {
            const domain = generateDomain();

            // Create first company
            await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'First Company',
                    domain: domain
                });

            // Try to create second company with same domain
            const response = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Second Company',
                    domain: domain
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('already exists');
        });
    });

    describe('GET /api/v1/companies - List Companies', () => {
        test('should get companies with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('totalPages');
        });

        test('should filter companies by industry', async () => {
            const response = await request(app)
                .get('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ industry: 'Technology' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should search companies by name', async () => {
            const response = await request(app)
                .get('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ search: 'Test' });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should sort companies by name ascending', async () => {
            const response = await request(app)
                .get('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ sortBy: 'name', sortOrder: 'asc' });

            expect(response.status).toBe(200);
        });

        test('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/companies');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/companies/:id - Get Single Company', () => {
        test('should get company by ID', async () => {
            if (!createdCompanyId) {
                // Create a company if we don't have one
                const createResponse = await request(app)
                    .post('/api/v1/companies')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        name: 'Get Test Company',
                        domain: generateDomain()
                    });
                createdCompanyId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/api/v1/companies/${createdCompanyId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id', createdCompanyId);
        });

        test('should return 404 for non-existent company', async () => {
            const response = await request(app)
                .get('/api/v1/companies/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 for invalid ID', async () => {
            const response = await request(app)
                .get('/api/v1/companies/invalid')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/v1/companies/:id - Update Company', () => {
        test('should update company details', async () => {
            if (!createdCompanyId) {
                const createResponse = await request(app)
                    .post('/api/v1/companies')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        name: 'Update Test Company',
                        domain: generateDomain()
                    });
                createdCompanyId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/api/v1/companies/${createdCompanyId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Company Name',
                    city: 'New York'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.name).toBe('Updated Company Name');
            expect(response.body.data.city).toBe('New York');
        });

        test('should return 404 for non-existent company', async () => {
            const response = await request(app)
                .put('/api/v1/companies/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Name'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/companies/:id - Delete Company', () => {
        test('should soft delete a company', async () => {
            // Create a company to delete
            const createResponse = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Company to Delete',
                    domain: generateDomain()
                });

            const companyId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/v1/companies/${companyId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
        });

        test('should return 404 for non-existent company', async () => {
            const response = await request(app)
                .delete('/api/v1/companies/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/companies/bulk-assign - Bulk Assign Companies', () => {
        test('should bulk assign companies to a user', async () => {
            // Create two companies
            const company1 = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Bulk Company 1',
                    domain: generateDomain()
                });

            const company2 = await request(app)
                .post('/api/v1/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Bulk Company 2',
                    domain: generateDomain()
                });

            const response = await request(app)
                .post('/api/v1/companies/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_ids: [company1.body.data.id, company2.body.data.id],
                    assigned_to: 1 // Assuming user ID 1 exists
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should fail without company_ids', async () => {
            const response = await request(app)
                .post('/api/v1/companies/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    assigned_to: 1
                });

            expect(response.status).toBe(400);
        });

        test('should fail without assigned_to', async () => {
            const response = await request(app)
                .post('/api/v1/companies/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_ids: [1, 2]
                });

            expect(response.status).toBe(400);
        });
    });
});
