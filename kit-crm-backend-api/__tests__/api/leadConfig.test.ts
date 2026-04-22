import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { getAuthToken } from '../helpers/testUtils';

describe('Lead Configuration API', () => {
    let authToken: string;
    let createdStatusId: number;
    let createdLostReasonId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    describe('Lead Statuses', () => {
        describe('POST /api/v1/lead-config/statuses - Create Status', () => {
            test('should create a new lead status', async () => {
                const timestamp = Date.now();
                const response = await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        name: `Test Status ${timestamp}`
                    });

                expect(response.status).toBe(201);
                expect(response.body.status).toBe(true);
                expect(response.body.data).toHaveProperty('id');

                createdStatusId = response.body.data.id;
            });

            test('should fail without required name', async () => {
                const response = await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({});

                expect(response.status).toBe(400);
            });

            test('should fail without authentication', async () => {
                const response = await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .send({
                        name: 'No Auth Status'
                    });

                expect(response.status).toBe(401);
            });

            test('should fail with duplicate name', async () => {
                const name = `Unique Status ${Date.now()}`;

                await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name });

                const response = await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name });

                expect(response.status).toBe(409);
                expect(response.body.message).toContain('already exists');
            });
        });

        describe('GET /api/v1/lead-config/statuses - List Statuses', () => {
            test('should get all lead statuses', async () => {
                const response = await request(app)
                    .get('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.status).toBe(true);
                expect(response.body.data).toBeInstanceOf(Array);
            });

            test('should filter active statuses only', async () => {
                const response = await request(app)
                    .get('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({ isActive: 'true' });

                expect(response.status).toBe(200);
                expect(response.body.data).toBeInstanceOf(Array);
            });
        });

        describe('GET /api/v1/lead-config/statuses/:id - Get Single Status', () => {
            test('should get status by ID', async () => {
                if (!createdStatusId) {
                    const createResponse = await request(app)
                        .post('/api/v1/lead-config/statuses')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ name: `Get Test ${Date.now()}` });
                    createdStatusId = createResponse.body.data.id;
                }

                const response = await request(app)
                    .get(`/api/v1/lead-config/statuses/${createdStatusId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toHaveProperty('id', createdStatusId);
            });

            test('should return 404 for non-existent status', async () => {
                const response = await request(app)
                    .get('/api/v1/lead-config/statuses/999999')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(404);
            });
        });

        describe('PUT /api/v1/lead-config/statuses/:id - Update Status', () => {
            test('should update status details', async () => {
                if (!createdStatusId) {
                    const createResponse = await request(app)
                        .post('/api/v1/lead-config/statuses')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ name: `Update Test ${Date.now()}` });
                    createdStatusId = createResponse.body.data.id;
                }

                const response = await request(app)
                    .put(`/api/v1/lead-config/statuses/${createdStatusId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        name: `Updated Status ${Date.now()}`
                    });

                expect(response.status).toBe(200);
            });
        });

        describe('DELETE /api/v1/lead-config/statuses/:id - Delete Status', () => {
            test('should soft delete a status', async () => {
                const createResponse = await request(app)
                    .post('/api/v1/lead-config/statuses')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name: `Delete Test ${Date.now()}` });

                const response = await request(app)
                    .delete(`/api/v1/lead-config/statuses/${createResponse.body.data.id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toContain('deleted successfully');
            });
        });
    });

    describe('Lost Reasons', () => {
        describe('POST /api/v1/lead-config/lost-reasons - Create Lost Reason', () => {
            test('should create a new lost reason', async () => {
                const timestamp = Date.now();
                const response = await request(app)
                    .post('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        reason: `Test Reason ${timestamp}`
                    });

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('id');

                createdLostReasonId = response.body.data.id;
            });

            test('should fail without reason', async () => {
                const response = await request(app)
                    .post('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({});

                expect(response.status).toBe(400);
            });

            test('should fail with duplicate reason', async () => {
                const reason = `Unique Reason ${Date.now()}`;

                await request(app)
                    .post('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ reason });

                const response = await request(app)
                    .post('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ reason });

                expect(response.status).toBe(409);
            });
        });

        describe('GET /api/v1/lead-config/lost-reasons - List Lost Reasons', () => {
            test('should get all lost reasons', async () => {
                const response = await request(app)
                    .get('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.data).toBeInstanceOf(Array);
            });

            test('should filter active reasons', async () => {
                const response = await request(app)
                    .get('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .query({ isActive: 'true' });

                expect(response.status).toBe(200);
            });
        });

        describe('PUT /api/v1/lead-config/lost-reasons/:id - Update Lost Reason', () => {
            test('should update lost reason', async () => {
                if (!createdLostReasonId) {
                    const createResponse = await request(app)
                        .post('/api/v1/lead-config/lost-reasons')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ reason: `Update Test ${Date.now()}` });
                    createdLostReasonId = createResponse.body.data.id;
                }

                const response = await request(app)
                    .put(`/api/v1/lead-config/lost-reasons/${createdLostReasonId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        reason: `Updated Reason ${Date.now()}`
                    });

                expect(response.status).toBe(200);
            });
        });

        describe('DELETE /api/v1/lead-config/lost-reasons/:id - Delete Lost Reason', () => {
            test('should soft delete a lost reason', async () => {
                const createResponse = await request(app)
                    .post('/api/v1/lead-config/lost-reasons')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ reason: `Delete Test ${Date.now()}` });

                const response = await request(app)
                    .delete(`/api/v1/lead-config/lost-reasons/${createResponse.body.data.id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
            });
        });
    });
});
