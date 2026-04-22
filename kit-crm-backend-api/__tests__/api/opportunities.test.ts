import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import { opportunityStages, opportunities, leads, companies, companyContacts, dataSources, leadStatuses } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

describe('Opportunities API', () => {
    let authToken: string;
    let testCompanyId: number;
    let testContactId: number;
    let testLeadId: number;
    let testDataSourceId: number;
    let testLeadStatusId: number;
    let testStageId: number;
    let testOpportunityId: number;
    let userId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();

        // Get current user
        const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
        userId = tokenPayload.userId;

        // Create test data source
        const [dataSource] = await db
            .insert(dataSources)
            .values({
                name: `Test DS ${Date.now()}`
            })
            .returning();
        testDataSourceId = dataSource.id;

        // Get or create a lead status
        let leadStatus = await db
            .select()
            .from(leadStatuses)
            .limit(1);

        if (leadStatus.length === 0) {
            const [newStatus] = await db
                .insert(leadStatuses)
                .values({ name: 'Test Status' })
                .returning();
            testLeadStatusId = newStatus.id;
        } else {
            testLeadStatusId = leadStatus[0].id;
        }

        // Create test company
        const [company] = await db
            .insert(companies)
            .values({
                name: `Test Company ${Date.now()}`,
                industry: 'Technology',
                dataSourceId: testDataSourceId,
                createdBy: userId
            })
            .returning();
        testCompanyId = company.id;

        // Create test contact
        const [contact] = await db
            .insert(companyContacts)
            .values({
                companyId: testCompanyId,
                name: `Test Contact ${Date.now()}`,
                email: `test${Date.now()}@example.com`
            })
            .returning();
        testContactId = contact.id;

        // Create test lead
        const [lead] = await db
            .insert(leads)
            .values({
                companyId: testCompanyId,
                contactId: testContactId,
                leadStatusId: testLeadStatusId,
                assignedTo: userId,
                createdBy: userId
            })
            .returning();
        testLeadId = lead.id;

        // Create test stage
        const [stage] = await db
            .insert(opportunityStages)
            .values({
                name: `Test Stage ${Date.now()}`,
                probability: 50,
                order: 1,
                isActive: true
            })
            .returning();
        testStageId = stage.id;
    });

    afterAll(async () => {
        // Cleanup in reverse order
        if (testOpportunityId) {
            await db.delete(opportunities).where(eq(opportunities.id, testOpportunityId));
        }
        if (testStageId) {
            await db.delete(opportunityStages).where(eq(opportunityStages.id, testStageId));
        }
        if (testLeadId) {
            await db.delete(leads).where(eq(leads.id, testLeadId));
        }
        if (testContactId) {
            await db.delete(companyContacts).where(eq(companyContacts.id, testContactId));
        }
        if (testCompanyId) {
            await db.delete(companies).where(eq(companies.id, testCompanyId));
        }
        if (testDataSourceId) {
            await db.delete(dataSources).where(eq(dataSources.id, testDataSourceId));
        }
    });

    /* ==================== OPPORTUNITY STAGES ==================== */

    describe('POST /api/v1/opportunities/stages - Create Opportunity Stage', () => {
        test('should create a new opportunity stage', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities/stages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Created Stage ${Date.now()}`,
                    probability: 25,
                    order: 2,
                    is_active: true
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.probability).toBe(25);
        });

        test('should return 400 when name is missing', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities/stages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ order: 5 });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 when order is missing', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities/stages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Test Stage' });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/opportunities/stages - List Opportunity Stages', () => {
        test('should get all opportunity stages', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities/stages')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });

        test('should filter by isActive', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities/stages?isActive=true')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });
    });

    describe('GET /api/v1/opportunities/stages/:id - Get Single Opportunity Stage', () => {
        test('should get a specific opportunity stage', async () => {
            const response = await request(app)
                .get(`/api/v1/opportunities/stages/${testStageId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.id).toBe(testStageId);
        });

        test('should return 404 for non-existent stage', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities/stages/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('PUT /api/v1/opportunities/stages/:id - Update Opportunity Stage', () => {
        test('should update an opportunity stage', async () => {
            const response = await request(app)
                .put(`/api/v1/opportunities/stages/${testStageId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ probability: 75 });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.probability).toBe(75);
        });

        test('should return 404 for non-existent stage', async () => {
            const response = await request(app)
                .put('/api/v1/opportunities/stages/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ probability: 50 });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('DELETE /api/v1/opportunities/stages/:id - Delete Opportunity Stage', () => {
        test('should soft delete an opportunity stage', async () => {
            const [tempStage] = await db
                .insert(opportunityStages)
                .values({
                    name: `Temp Stage ${Date.now()}`,
                    probability: 10,
                    order: 99,
                    isActive: true
                })
                .returning();

            const response = await request(app)
                .delete(`/api/v1/opportunities/stages/${tempStage.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);

            // Verify soft delete
            const [deletedStage] = await db
                .select()
                .from(opportunityStages)
                .where(eq(opportunityStages.id, tempStage.id));

            expect(deletedStage.isActive).toBe(false);
        });
    });

    /* ==================== OPPORTUNITIES ==================== */

    describe('POST /api/v1/opportunities - Create Opportunity', () => {
        test('should create a new opportunity', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                          lead_id: testLeadId,
                          stage_id: testStageId,
                          createdBy: userId,
                          expected_value: 50000,
                    expected_close_date: '2026-06-01',
                    probability: 50,
                    description: 'Test opportunity'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.leadId).toBe(testLeadId);
            expect(response.body.data.stageId).toBe(testStageId);

            testOpportunityId = response.body.data.id;
        });

        test('should return 400 when lead_id is missing', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ stage_id: testStageId });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 when stage_id is missing', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ lead_id: testLeadId });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });

        test('should return 404 for non-existent lead', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    lead_id: 999999,
                    stage_id: testStageId
                });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/opportunities - List Opportunities', () => {
        test('should get all opportunities', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });

        test('should filter by leadId', async () => {
            const response = await request(app)
                .get(`/api/v1/opportunities?leaded=${testLeadId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should filter by stageId', async () => {
            const response = await request(app)
                .get(`/api/v1/opportunities?stageId=${testStageId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });
    });

    describe('GET /api/v1/opportunities/:id - Get Single Opportunity', () => {
        test('should get a specific opportunity', async () => {
            const response = await request(app)
                .get(`/api/v1/opportunities/${testOpportunityId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.id).toBe(testOpportunityId);
        });

        test('should return 404 for non-existent opportunity', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('PUT /api/v1/opportunities/:id - Update Opportunity', () => {
        test('should update an opportunity', async () => {
            const response = await request(app)
                .put(`/api/v1/opportunities/${testOpportunityId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    expected_value: 75000,
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.description).toBe('Updated description');
        });

        test('should return 404 for non-existent opportunity', async () => {
            const response = await request(app)
                .put('/api/v1/opportunities/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ description: 'Test' });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('POST /api/v1/opportunities/bulk-assign - Bulk Assign', () => {
        test('should bulk update opportunities', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_ids: [testOpportunityId],
                    stage_id: testStageId
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should return 400 when opportunity_ids is missing', async () => {
            const response = await request(app)
                .post('/api/v1/opportunities/bulk-assign')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ stage_id: testStageId });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });
    });

    describe('DELETE /api/v1/opportunities/:id - Delete Opportunity', () => {
        test('should delete an opportunity', async () => {
            // Create a temp opportunity to delete
            const [tempOpp] = await db
                .insert(opportunities)
                .values({
                    createdBy: userId,
                    leadId: testLeadId,
                    stageId: testStageId
                })
                .returning();

            const response = await request(app)
                .delete(`/api/v1/opportunities/${tempOpp.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);

            // Verify deletion
            const deleted = await db
                .select()
                .from(opportunities)
                .where(eq(opportunities.id, tempOpp.id));

            expect(deleted.length).toBe(0);
        });

        test('should return 404 for non-existent opportunity', async () => {
            const response = await request(app)
                .delete('/api/v1/opportunities/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('Authorization', () => {
        test('should return 401 without token for stages', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities/stages');

            expect(response.status).toBe(401);
        });

        test('should return 401 without token for opportunities', async () => {
            const response = await request(app)
                .get('/api/v1/opportunities');

            expect(response.status).toBe(401);
        });
    });
});
