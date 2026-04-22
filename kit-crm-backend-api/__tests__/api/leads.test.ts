import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { getAuthToken, generateEmail, generateDomain } from '../helpers/testUtils';

describe('Leads API', () => {
    let authToken: string;
    let testCompanyId: number;
    let testContactId: number;
    let testStatusId: number;
    let createdLeadId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();

        // Create test company
        const companyResponse = await request(app)
            .post('/api/v1/companies')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Lead Test Company',
                domain: generateDomain()
            });
        testCompanyId = companyResponse.body.data.id;

        // Create test contact
        const contactResponse = await request(app)
            .post('/api/v1/contacts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                company_id: testCompanyId,
                name: 'Lead Test Contact',
                email: generateEmail()
            });
        testContactId = contactResponse.body.data.id;

        // Create test status
        const statusResponse = await request(app)
            .post('/api/v1/lead-config/statuses')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: `Test Lead Status ${Date.now()}`
            });
        testStatusId = statusResponse.body.data.id;
    });

    describe('POST /api/v1/leads - Create Lead', () => {
        test('should create a new lead with valid data', async () => {
            // Get current user ID from auth token
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            const response = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    contact_id: testContactId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo,
                    priority: 'high',
                    tags: 'test,opportunity'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.priority).toBe('high');

            createdLeadId = response.body.data.id;
        });

        test('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/leads')
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: 1
                });

            expect(response.status).toBe(401);
        });

        test('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId
                    // Missing lead_status_id and assigned_to
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        test('should create lead with default priority', async () => {
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            const response = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo
                });

            expect(response.status).toBe(201);
            expect(response.body.data.priority).toBe('medium'); // default priority
        });

        test('should fail with non-existent company', async () => {
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            const response = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: 999999,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Company not found');
        });

        test('should create lead with tags', async () => {
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            const response = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo,
                    tags: 'enterprise,high-value,q4-2024'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.tags).toBe('enterprise,high-value,q4-2024');
        });
    });

    describe('GET /api/v1/leads - List Leads', () => {
        test('should get leads with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
        });

        test('should filter leads by company', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ companyId: testCompanyId });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should filter leads by status', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ leadStatusId: testStatusId });

            expect(response.status).toBe(200);
        });

        test('should filter leads by priority', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ priority: 'high' });

            expect(response.status).toBe(200);
        });

        test('should filter leads by priority', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ priority: 'high' });

            expect(response.status).toBe(200);
        });

        test('should search leads by tags', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ search: 'test' });

            expect(response.status).toBe(200);
        });

        test('should sort leads by created date descending', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ sortBy: 'createdAt', sortOrder: 'desc' });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should filter by qualified date range', async () => {
            const response = await request(app)
                .get('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ 
                    qualifiedFrom: '2024-01-01',
                    qualifiedTo: '2024-12-31'
                });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/v1/leads/:id - Get Single Lead', () => {
        test('should get lead by ID', async () => {
            if (!createdLeadId) {
                const profileResponse = await request(app)
                    .get('/api/v1/profile')
                    .set('Authorization', `Bearer ${authToken}`);
                const assignedTo = profileResponse.body.data.userId;

                const createResponse = await request(app)
                    .post('/api/v1/leads')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        company_id: testCompanyId,
                        lead_status_id: testStatusId,
                        assigned_to: assignedTo
                    });
                createdLeadId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/api/v1/leads/${createdLeadId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('id', createdLeadId);
            expect(response.body.data).toHaveProperty('companyId');
            expect(response.body.data).toHaveProperty('companyName');
            expect(response.body.data).toHaveProperty('leadStatusId');
            expect(response.body.data).toHaveProperty('leadStatusName');
        });

        test('should return 404 for non-existent lead', async () => {
            const response = await request(app)
                .get('/api/v1/leads/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });

        test('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/v1/leads/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/v1/leads/:id - Update Lead', () => {
        test('should update lead details', async () => {
            if (!createdLeadId) {
                const profileResponse = await request(app)
                    .get('/api/v1/profile')
                    .set('Authorization', `Bearer ${authToken}`);
                const assignedTo = profileResponse.body.data.userId;

                const createResponse = await request(app)
                    .post('/api/v1/leads')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        company_id: testCompanyId,
                        lead_status_id: testStatusId,
                        assigned_to: assignedTo
                    });
                createdLeadId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/api/v1/leads/${createdLeadId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    priority: 'urgent',
                    tags: 'updated,urgent'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.priority).toBe('urgent');
        });

        test('should return 404 for non-existent lead', async () => {
            const response = await request(app)
                .put('/api/v1/leads/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    priority: 'high'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/leads/:id - Delete Lead', () => {
        test('should soft delete a lead', async () => {
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            const createResponse = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo
                });

            const leadId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/v1/leads/${leadId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('deleted successfully');

            // Verify lead is soft deleted
            const getResponse = await request(app)
                .get(`/api/v1/leads/${leadId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(404);
        });

        test('should return 404 when deleting non-existent lead', async () => {
            const response = await request(app)
                .delete('/api/v1/leads/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/leads/bulk-assign - Bulk Assign Leads', () => {
        test('should assign multiple leads to a user', async () => {
            // Get current user ID from auth token
            const profileResponse = await request(app)
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            const assignedTo = profileResponse.body.data.userId;

            // Create test leads
            const lead1 = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo
                });

            const lead2 = await request(app)
                .post('/api/v1/leads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    lead_status_id: testStatusId,
                    assigned_to: assignedTo
                });

            const leadIds = [lead1.body.data.id, lead2.body.data.id];

            const response = await request(app)
                .post('/api/v1/leads/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    lead_ids: leadIds,
                    assigned_to: assignedTo
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('assigned successfully');
        });

        test('should fail without lead_ids', async () => {
            const response = await request(app)
                .post('/api/v1/leads/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    assigned_to: 1
                });

            expect(response.status).toBe(400);
        });

        test('should fail with empty lead_ids array', async () => {
            const response = await request(app)
                .post('/api/v1/leads/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    lead_ids: [],
                    assigned_to: 1
                });

            expect(response.status).toBe(400);
        });
    });
});
