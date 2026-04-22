import { describe, test, expect, beforeAll, afterAll, it } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import { activityTypes, activities, companies, leads, opportunities, opportunityStages, leadStatuses, dataSources } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

let authToken: string;
let userId: number;
let testActivityTypeId: number;
let testCompanyId: number;
let testLeadId: number;
let testOpportunityId: number;
let testActivityId: number;
let testDataSourceId: number;
let testLeadStatusId: number;
let testStageId: number;

beforeAll(async () => {
    authToken = await getAuthToken();

    // Get current user ID from token
    const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = tokenPayload.userId;

    // Create test data source
    const [dataSource] = await db
        .insert(dataSources)
        .values({
            name: `Test DS Activities ${Date.now()}`
        })
        .returning();
    testDataSourceId = dataSource.id;

    // Get or create lead status
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
            name: `Test Activity Company ${Date.now()}`,
            industry: 'Technology',
            dataSourceId: testDataSourceId,
            createdBy: userId
        })
        .returning();
    testCompanyId = company.id;

    // Create test lead
    const [lead] = await db
            .insert(leads)
            .values({
                companyId: testCompanyId,
                leadStatusId: testLeadStatusId,
                assignedTo: userId,
                createdBy: userId
            })
            .returning();
    testLeadId = lead.id;

    // Create opportunity stage
    const [oppStage] = await db
        .insert(opportunityStages)
        .values({
            name: `Discovery ${Date.now()}`,
            probability: 25,
            order: 1
        })
        .returning();
    testStageId = oppStage.id;

    // Create test opportunity
    const [opportunity] = await db
        .insert(opportunities)
        .values({
            createdBy: userId,
            leadId: testLeadId,
            stageId: testStageId,
            expectedValue: '10000.00'
        })
        .returning();
    testOpportunityId = opportunity.id;
});

afterAll(async () => {
    // Clean up test data
    await db.delete(activities).where(eq(activities.performedBy, userId));
    await db.delete(activityTypes).where(eq(activityTypes.name, 'Call'));
    await db.delete(opportunities).where(eq(opportunities.id, testOpportunityId));
    await db.delete(leads).where(eq(leads.id, testLeadId));
    await db.delete(companies).where(eq(companies.id, testCompanyId));
    await db.delete(opportunityStages).where(eq(opportunityStages.id, testStageId));
    await db.delete(dataSources).where(eq(dataSources.id, testDataSourceId));
});

/* =========================
   ACTIVITY TYPES TESTS
========================= */

describe('Activity Type Creation', () => {
    it('should create a new activity type', async () => {
        const res = await request(app)
            .post('/api/v1/activities/types')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Call' });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.name).toBe('Call');
        testActivityTypeId = res.body.data.id;
    });

    it('should not create duplicate activity type', async () => {
        const res = await request(app)
            .post('/api/v1/activities/types')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Call' });

        expect(res.status).toBe(409);
        expect(res.body.status).toBe(false);
    });

    it('should not create activity type without name', async () => {
        const res = await request(app)
            .post('/api/v1/activities/types')
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

describe('List Activity Types', () => {
    it('should list all activity types', async () => {
        const res = await request(app)
            .get('/api/v1/activities/types')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});

/* =========================
   ACTIVITY TESTS
========================= */

describe('Activity Creation', () => {
    it('should create a new activity for a company', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                activity_type_id: testActivityTypeId,
                subject: 'Initial Discovery Call',
                notes: 'Discussed project requirements',
                duration: 30,
                outcome: 'Interested',
                activity_date: '2024-01-20T10:00:00Z'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.subject).toBe('Initial Discovery Call');
        expect(res.body.data.entityType).toBe('company');
        testActivityId = res.body.data.id;
    });

    it('should create an activity for a lead', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'lead',
                entity_id: testLeadId,
                activity_type_id: testActivityTypeId,
                subject: 'Follow-up Call',
                duration: 15
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.entityType).toBe('lead');
    });

    it('should create an activity for an opportunity', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'opportunity',
                entity_id: testOpportunityId,
                activity_type_id: testActivityTypeId,
                subject: 'Proposal Discussion',
                outcome: 'Positive'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.entityType).toBe('opportunity');
    });

    it('should not create activity without entity type', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_id: testCompanyId,
                activity_type_id: testActivityTypeId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create activity without entity ID', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                activity_type_id: testActivityTypeId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create activity without activity type ID', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create activity with invalid entity type', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'invalid',
                entity_id: testCompanyId,
                activity_type_id: testActivityTypeId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create activity with non-existent activity type', async () => {
        const res = await request(app)
            .post('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                activity_type_id: 999999
            });

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });
});

describe('List Activities', () => {
    it('should list all activities', async () => {
        const res = await request(app)
            .get('/api/v1/activities')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toBeDefined();
    });

    it('should filter activities by entity type', async () => {
        const res = await request(app)
            .get('/api/v1/activities?entityType=company')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((a: any) => a.entityType === 'company')).toBe(true);
    });

    it('should filter activities by entity ID', async () => {
        const res = await request(app)
            .get(`/api/v1/activities?entityType=company&entityId=${testCompanyId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((a: any) => a.entityId === testCompanyId)).toBe(true);
    });

    it('should filter activities by activity type', async () => {
        const res = await request(app)
            .get(`/api/v1/activities?activityTypeId=${testActivityTypeId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((a: any) => a.activityTypeId === testActivityTypeId)).toBe(true);
    });

    it('should filter activities by performer', async () => {
        const res = await request(app)
            .get(`/api/v1/activities?performedBy=${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((a: any) => a.performedBy === userId)).toBe(true);
    });

    it('should filter activities by outcome', async () => {
        const res = await request(app)
            .get('/api/v1/activities?outcome=Interested')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should search activities by subject', async () => {
        const res = await request(app)
            .get('/api/v1/activities?search=Discovery')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should support pagination', async () => {
        const res = await request(app)
            .get('/api/v1/activities?page=1&limit=2')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.pagination.limit).toBe(2);
    });

    it('should support sorting', async () => {
        const res = await request(app)
            .get('/api/v1/activities?sortBy=activityDate&sortOrder=asc')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });
});

describe('Get Single Activity', () => {
    it('should get an activity by ID', async () => {
        const res = await request(app)
            .get(`/api/v1/activities/${testActivityId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.id).toBe(testActivityId);
        expect(res.body.data.activityTypeName).toBe('Call');
    });

    it('should return 404 for non-existent activity', async () => {
        const res = await request(app)
            .get('/api/v1/activities/999999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid activity ID', async () => {
        const res = await request(app)
            .get('/api/v1/activities/invalid')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

describe('Update Activity', () => {
    it('should update an activity', async () => {
        const res = await request(app)
            .put(`/api/v1/activities/${testActivityId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                subject: 'Updated Discovery Call',
                notes: 'Updated notes',
                duration: 45,
                outcome: 'Very Interested'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.subject).toBe('Updated Discovery Call');
        expect(res.body.data.duration).toBe(45);
    });

    it('should return 404 for non-existent activity', async () => {
        const res = await request(app)
            .put('/api/v1/activities/999999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ subject: 'Updated' });

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid activity ID', async () => {
        const res = await request(app)
            .put('/api/v1/activities/invalid')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ subject: 'Updated' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

describe('Activity Statistics', () => {
    it('should get activity statistics', async () => {
        const res = await request(app)
            .get('/api/v1/activities/stats')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.totalActivities).toBeGreaterThan(0);
        expect(res.body.data.byType).toBeDefined();
        expect(res.body.data.byOutcome).toBeDefined();
        expect(res.body.data.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should filter stats by performer', async () => {
        const res = await request(app)
            .get(`/api/v1/activities/stats?performedBy=${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should filter stats by date range', async () => {
        const res = await request(app)
            .get('/api/v1/activities/stats?dateFrom=2024-01-01&dateTo=2024-12-31')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });
});

describe('Delete Activity', () => {
    it('should delete an activity', async () => {
        const res = await request(app)
            .delete(`/api/v1/activities/${testActivityId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should return 404 for non-existent activity', async () => {
        const res = await request(app)
            .delete('/api/v1/activities/999999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid activity ID', async () => {
        const res = await request(app)
            .delete('/api/v1/activities/invalid')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

describe('Activity Authorization', () => {
    it('should not allow access without token', async () => {
        const res = await request(app)
            .get('/api/v1/activities');

        expect(res.status).toBe(401);
    });

    it('should not allow access with invalid token', async () => {
        const res = await request(app)
            .get('/api/v1/activities')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(401);
    });
});
