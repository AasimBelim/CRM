import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import { getAuthToken } from '../helpers/testUtils';

describe('Data Sources API', () => {
    let authToken: string;
    let createdDataSourceId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    describe('POST /api/v1/data-sources - Create Data Source', () => {
        test('should create a new data source', async () => {
            const timestamp = Date.now();
            const response = await request(app)
                .post('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Source ${timestamp}`,
                    is_active: true
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');

            createdDataSourceId = response.body.data.id;
        });

        test('should fail without name', async () => {
            const response = await request(app)
                .post('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        test('should fail with duplicate name', async () => {
            const name = `Unique Source ${Date.now()}`;

            await request(app)
                .post('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name });

            const response = await request(app)
                .post('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name });

            expect(response.status).toBe(409);
        });
    });

    describe('GET /api/v1/data-sources - List Data Sources', () => {
        test('should get all data sources', async () => {
            const response = await request(app)
                .get('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test('should filter by isActive', async () => {
            const response = await request(app)
                .get('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ isActive: 'true' });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/v1/data-sources/:id - Get Single Data Source', () => {
        test('should get data source by ID', async () => {
            if (!createdDataSourceId) {
                const createResponse = await request(app)
                    .post('/api/v1/data-sources')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name: `Get Test ${Date.now()}` });
                createdDataSourceId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/api/v1/data-sources/${createdDataSourceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('id', createdDataSourceId);
        });

        test('should return 404 for non-existent data source', async () => {
            const response = await request(app)
                .get('/api/v1/data-sources/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/v1/data-sources/:id - Update Data Source', () => {
        test('should update data source', async () => {
            if (!createdDataSourceId) {
                const createResponse = await request(app)
                    .post('/api/v1/data-sources')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ name: `Update Test ${Date.now()}` });
                createdDataSourceId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/api/v1/data-sources/${createdDataSourceId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Updated Source ${Date.now()}`,
                    is_active: false
                });

            expect(response.status).toBe(200);
            expect(response.body.data.isActive).toBe(false);
        });
    });

    describe('DELETE /api/v1/data-sources/:id - Delete Data Source', () => {
        test('should soft delete data source', async () => {
            const createResponse = await request(app)
                .post('/api/v1/data-sources')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: `Delete Test ${Date.now()}` });

            const response = await request(app)
                .delete(`/api/v1/data-sources/${createResponse.body.data.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });
});

describe('Data Imports API', () => {
    let authToken: string;
    let createdImportId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();
    });

    describe('POST /api/v1/data-imports - Create Data Import', () => {
        test('should create a new import job', async () => {
            const response = await request(app)
                .post('/api/v1/data-imports')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    file_name: 'test-import.csv',
                    total_records: 100
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.status).toBe('processing');

            createdImportId = response.body.data.id;
        });

        test('should fail without total_records', async () => {
            const response = await request(app)
                .post('/api/v1/data-imports')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    file_name: 'test.csv'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/data-imports - List Imports', () => {
        test('should get imports with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/data-imports')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });

        test('should filter by status', async () => {
            const response = await request(app)
                .get('/api/v1/data-imports')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ status: 'processing' });

            expect(response.status).toBe(200);
        });
    });

    describe('PUT /api/v1/data-imports/:id - Update Import', () => {
        test('should update import status', async () => {
            if (!createdImportId) {
                const createResponse = await request(app)
                    .post('/api/v1/data-imports')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        file_name: 'update-test.csv',
                        total_records: 50
                    });
                createdImportId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/api/v1/data-imports/${createdImportId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'completed',
                    successful_records: 45,
                    failed_records: 5
                });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('completed');
        });
    });
});
