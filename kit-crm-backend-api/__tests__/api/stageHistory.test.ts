import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import { stageHistory, opportunities, leads, companies, opportunityStages, leadStatuses } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

let adminToken: string;
let userId: number;
let companyId: number;
let leadId: number;
let opportunityId: number;
let historyId: number;
let stageId: number;
let leadStatusId: number;

describe('Stage History API', () => {
    beforeAll(async () => {
        // Get auth token
        adminToken = await getAuthToken();
        
        // Get current user ID from token
        const tokenPayload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
        userId = tokenPayload.userId;

        // Get or create opportunity stage
        let stage = await db.select().from(opportunityStages).limit(1);
        if (stage.length === 0) {
            const [newStage] = await db
                .insert(opportunityStages)
                .values({ name: 'Test Stage', probability: 50, order: 1 })
                .returning();
            stageId = newStage.id;
        } else {
            stageId = stage[0].id;
        }

        // Get or create lead status
        let leadStatus = await db.select().from(leadStatuses).limit(1);
        if (leadStatus.length === 0) {
            const [newStatus] = await db
                .insert(leadStatuses)
                .values({ name: 'Test Lead Status' })
                .returning();
            leadStatusId = newStatus.id;
        } else {
            leadStatusId = leadStatus[0].id;
        }

        // Create test company directly
        const [company] = await db
            .insert(companies)
            .values({
                name: `Test Stage History Company ${Date.now()}`,
                industry: 'Technology',
                website: `https://teststage${Date.now()}.com`,
                domain: `teststage${Date.now()}.com`,
                createdBy: userId
            })
            .returning();
        companyId = company.id;

        // Create test lead directly
        const [lead] = await db
            .insert(leads)
            .values({
                companyId: companyId,
                leadStatusId: leadStatusId,
                assignedTo: userId,
                createdBy: userId
            })
            .returning();
        leadId = lead.id;

        // Create test opportunity directly
        const [opportunity] = await db
            .insert(opportunities)
            .values({
                createdBy: userId,
                leadId: leadId,
                stageId: stageId,
                expectedValue: '25000',
                description: 'Test opportunity for stage history'
            })
            .returning();
        opportunityId = opportunity.id;
    });

    afterAll(async () => {
        // Clean up test data
        await db.delete(stageHistory).where(eq(stageHistory.changedBy, userId));
        if (opportunityId) {
            await db.delete(opportunities).where(eq(opportunities.id, opportunityId));
        }
        if (leadId) {
            await db.delete(leads).where(eq(leads.id, leadId));
        }
        if (companyId) {
            await db.delete(companies).where(eq(companies.id, companyId));
        }
    });

    describe('POST /api/v1/stage-history', () => {
        test('should create stage history for opportunity', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'opportunity',
                    entity_id: opportunityId,
                    from_stage_id: stageId,
                    to_stage_id: stageId,
                    notes: 'Moved to next stage'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.entityType).toBe('opportunity');
            expect(res.body.data.entityId).toBe(opportunityId);
            expect(res.body.data.fromStageId).toBe(stageId);
            expect(res.body.data.toStageId).toBe(2);
            expect(res.body.data.changedBy).toBe(userId);

            historyId = res.body.data.id;
        });

        test('should create stage history for lead', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'lead',
                    entity_id: leadId,
                    from_stage_id: 1,
                    to_stage_id: 2
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data.entityType).toBe('lead');
            expect(res.body.data.entityId).toBe(leadId);
        });

        test('should create stage history without from_stage_id (initial stage)', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'opportunity',
                    entity_id: opportunityId,
                    to_stage_id: 1
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data.fromStageId).toBeNull();
        });

        test('should fail with invalid entity type', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'invalid',
                    entity_id: opportunityId,
                    to_stage_id: 2
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });

        test('should fail without entity_id', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'opportunity',
                    to_stage_id: 2
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });

        test('should fail without to_stage_id', async () => {
            const res = await request(app)
                .post('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'opportunity',
                    entity_id: opportunityId
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/stage-history', () => {
        test('should retrieve all stage history', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
        });

        test('should filter stage history by entity type', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history?entityType=opportunity')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.every((h: any) => h.entityType === 'opportunity')).toBe(true);
        });

        test('should filter stage history by entity ID', async () => {
            const res = await request(app)
                .get(`/api/v1/stage-history?entityType=opportunity&entityId=${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.every((h: any) => h.entityId === opportunityId)).toBe(true);
        });

        test('should filter stage history by fromStageId', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history?fromStageId=1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should filter stage history by toStageId', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history?toStageId=2')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should filter stage history by changedBy', async () => {
            const res = await request(app)
                .get(`/api/v1/stage-history?changedBy=${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.every((h: any) => h.changedBy === userId)).toBe(true);
        });

        test('should filter stage history by date range', async () => {
            const dateFrom = new Date('2024-01-01').toISOString();
            const dateTo = new Date().toISOString();

            const res = await request(app)
                .get(`/api/v1/stage-history?dateFrom=${dateFrom}&dateTo=${dateTo}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should include stage names and user details', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('changedByName');
                expect(res.body.data[0]).toHaveProperty('changedByEmail');
            }
        });
    });

    describe('GET /api/v1/stage-history/:id', () => {
        test('should retrieve a single stage history record', async () => {
            const res = await request(app)
                .get(`/api/v1/stage-history/${historyId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.id).toBe(historyId);
            expect(res.body.data).toHaveProperty('changedByName');
            expect(res.body.data).toHaveProperty('changedByEmail');
        });

        test('should return 404 for non-existent history', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history/999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.status).toBe(false);
        });

        test('should return 400 for invalid history ID', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history/invalid')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/stage-history/stats', () => {
        test('should retrieve stage history statistics', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data).toHaveProperty('totalTransitions');
            expect(res.body.data).toHaveProperty('byStage');
            expect(typeof res.body.data.totalTransitions).toBe('number');
            expect(typeof res.body.data.byStage).toBe('object');
        });

        test('should filter stats by entity type', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history/stats?entityType=opportunity')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data).toHaveProperty('totalTransitions');
        });

        test('should filter stats by entity ID', async () => {
            const res = await request(app)
                .get(`/api/v1/stage-history/stats?entityType=opportunity&entityId=${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should fail with invalid entity type', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history/stats?entityType=invalid')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('Automatic Stage Tracking (Middleware)', () => {
        test('should automatically track opportunity stage change', async () => {
            // Update opportunity stage
            const updateRes = await request(app)
                .put(`/api/v1/opportunities/${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    stage_id: 3
                });

            expect(updateRes.status).toBe(200);

            // Verify stage history was created
            const historyRes = await request(app)
                .get(`/api/v1/stage-history?entityType=opportunity&entityId=${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(historyRes.status).toBe(200);
            const recentHistory = historyRes.body.data.find(
                (h: any) => h.toStageId === 3 && h.entityId === opportunityId
            );
            expect(recentHistory).toBeDefined();
            expect(recentHistory.changedBy).toBe(userId);
        });

        test('should automatically track lead status change', async () => {
            // Update lead status
            const updateRes = await request(app)
                .put(`/api/v1/leads/${leadId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    lead_status_id: 3
                });

            expect(updateRes.status).toBe(200);

            // Verify stage history was created
            const historyRes = await request(app)
                .get(`/api/v1/stage-history?entityType=lead&entityId=${leadId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(historyRes.status).toBe(200);
            const recentHistory = historyRes.body.data.find(
                (h: any) => h.toStageId === 3 && h.entityId === leadId
            );
            expect(recentHistory).toBeDefined();
            expect(recentHistory.changedBy).toBe(userId);
        });

        test('should not create history when stage does not change', async () => {
            // Get current history count
            const beforeRes = await request(app)
                .get(`/api/v1/stage-history?entityType=opportunity&entityId=${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            const beforeCount = beforeRes.body.data.length;

            // Update opportunity without changing stage
            await request(app)
                .put(`/api/v1/opportunities/${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Updated description without stage change'
                });

            // Verify history count did not increase
            const afterRes = await request(app)
                .get(`/api/v1/stage-history?entityType=opportunity&entityId=${opportunityId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            const afterCount = afterRes.body.data.length;
            expect(afterCount).toBe(beforeCount);
        });
    });

    describe('Authorization', () => {
        test('should fail without token', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe(false);
        });

        test('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/stage-history')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe(false);
        });
    });
});
