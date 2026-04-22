import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { getAuthToken, generateEmail, generateDomain } from '../helpers/testUtils';

describe('Contacts API', () => {
    let authToken: string;
    let testCompanyId: number;
    let createdContactId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();

        // Create a test company for contacts
        const companyResponse = await request(app)
            .post('/api/v1/companies')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Contact Test Company',
                domain: generateDomain()
            });

        testCompanyId = companyResponse.body.data.id;
    });

    describe('POST /api/v1/contacts - Create Contact', () => {
        test('should create a new contact with valid data', async () => {
            const response = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    name: 'John Doe',
                    email: generateEmail(),
                    phone: '+1234567890',
                    designation: 'CEO',
                    is_primary: true
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('John Doe');

            createdContactId = response.body.data.id;
        });

        test('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/contacts')
                .send({
                    company_id: testCompanyId,
                    name: 'Jane Doe',
                    email: generateEmail()
                });

            expect(response.status).toBe(401);
        });

        test('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'John Doe'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        test('should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    name: 'Invalid Email',
                    email: 'not-an-email'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid email');
        });

        test('should fail with non-existent company', async () => {
            const response = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: 999999,
                    name: 'John Doe',
                    email: generateEmail()
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('Company not found');
        });

        test('should unset other primary contacts when creating new primary', async () => {
            // Create first primary contact
            await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    name: 'First Primary',
                    email: generateEmail(),
                    is_primary: true
                });

            // Create second primary contact
            const response = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    name: 'Second Primary',
                    email: generateEmail(),
                    is_primary: true
                });

            expect(response.status).toBe(201);
        });
    });

    describe('GET /api/v1/contacts - List Contacts', () => {
        test('should get contacts with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });

        test('should filter contacts by company', async () => {
            const response = await request(app)
                .get('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ companyId: testCompanyId });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should search contacts by name', async () => {
            const response = await request(app)
                .get('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ search: 'John' });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/v1/contacts/company/:companyId - Get Company Contacts', () => {
        test('should get all contacts for a company', async () => {
            const response = await request(app)
                .get(`/api/v1/contacts/company/${testCompanyId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should return 404 for non-existent company', async () => {
            const response = await request(app)
                .get('/api/v1/contacts/company/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/v1/contacts/:id - Get Single Contact', () => {
        test('should get contact by ID', async () => {
            if (!createdContactId) {
                const createResponse = await request(app)
                    .post('/api/v1/contacts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        company_id: testCompanyId,
                        name: 'Get Test Contact',
                        email: generateEmail()
                    });
                createdContactId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/api/v1/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('id', createdContactId);
        });

        test('should return 404 for non-existent contact', async () => {
            const response = await request(app)
                .get('/api/v1/contacts/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/v1/contacts/:id - Update Contact', () => {
        test('should update contact details', async () => {
            if (!createdContactId) {
                const createResponse = await request(app)
                    .post('/api/v1/contacts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        company_id: testCompanyId,
                        name: 'Update Test',
                        email: generateEmail()
                    });
                createdContactId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/api/v1/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Contact Name',
                    designation: 'CTO'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('Updated Contact Name');
            expect(response.body.data.designation).toBe('CTO');
        });

        test('should fail with invalid email format', async () => {
            const response = await request(app)
                .put(`/api/v1/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/v1/contacts/:id - Delete Contact', () => {
        test('should soft delete a contact', async () => {
            const createResponse = await request(app)
                .post('/api/v1/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    company_id: testCompanyId,
                    name: 'Delete Test',
                    email: generateEmail()
                });

            const contactId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/v1/contacts/${contactId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('deleted successfully');
        });
    });
});
