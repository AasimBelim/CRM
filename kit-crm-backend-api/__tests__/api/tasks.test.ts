import { describe, test, expect, beforeAll, afterAll, it } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import { tasks, users, companies, leads, opportunities, deals, opportunityStages, leadStatuses, dataSources } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

let authToken: string;
let userId: number;
let secondUserId: number;
let testCompanyId: number;
let testLeadId: number;
let testOpportunityId: number;
let testDealId: number;
let testTaskId: number;
let testDataSourceId: number;
let testLeadStatusId: number;
let testStageId: number;

beforeAll(async () => {
    authToken = await getAuthToken();

    // Get current user ID from token
    const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = tokenPayload.userId;

    // Get second user (any other user from DB)
    const allUsers = await db.select().from(users).limit(2);
    secondUserId = allUsers.find(u => u.id !== userId)?.id || userId;

    // Create test data source
    const [dataSource] = await db
        .insert(dataSources)
        .values({
            name: `Test DS Tasks ${Date.now()}`
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
            name: `Test Task Company ${Date.now()}`,
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

    // Create test deal
    const [deal] = await db
        .insert(deals)
        .values({
            opportunityId: testOpportunityId,
            dealValue: '10000.00',
            status: 'pending',
            createdBy: userId
        })
        .returning();
    testDealId = deal.id;
});

afterAll(async () => {
    // Clean up test data
    await db.delete(tasks).where(eq(tasks.createdBy, userId));
    await db.delete(deals).where(eq(deals.id, testDealId));
    await db.delete(opportunities).where(eq(opportunities.id, testOpportunityId));
    await db.delete(leads).where(eq(leads.id, testLeadId));
    await db.delete(companies).where(eq(companies.id, testCompanyId));
    await db.delete(opportunityStages).where(eq(opportunityStages.id, testStageId));
    await db.delete(dataSources).where(eq(dataSources.id, testDataSourceId));
});

/* =========================
   TASK CREATION TESTS
========================= */

describe('Task Creation', () => {
    it('should create a new task for a company', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                title: 'Follow up with client',
                description: 'Discuss next steps',
                task_type: 'Follow-up',
                priority: 'high',
                due_date: '2024-02-01',
                assigned_to: userId
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.title).toBe('Follow up with client');
        expect(res.body.data.priority).toBe('high');
        expect(res.body.data.completed).toBe(false);
        testTaskId = res.body.data.id;
    });

    it('should create a task for a lead', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'lead',
                entity_id: testLeadId,
                title: 'Qualify lead',
                task_type: 'Research',
                priority: 'medium',
                due_date: '2024-02-05'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.entityType).toBe('lead');
    });

    it('should create a task for an opportunity', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'opportunity',
                entity_id: testOpportunityId,
                title: 'Prepare proposal',
                task_type: 'Documentation',
                priority: 'urgent',
                due_date: '2024-01-25'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.priority).toBe('urgent');
    });

    it('should create a task for a deal', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'deal',
                entity_id: testDealId,
                title: 'Send contract',
                task_type: 'Documentation',
                priority: 'high',
                due_date: '2024-02-10'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.data.entityType).toBe('deal');
    });

    it('should not create task without entity type', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_id: testCompanyId,
                title: 'Task',
                task_type: 'Follow-up',
                priority: 'medium',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task without entity ID', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                title: 'Task',
                task_type: 'Follow-up',
                priority: 'medium',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task without title', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                task_type: 'Follow-up',
                priority: 'medium',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task without task type', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                title: 'Task',
                priority: 'medium',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task without priority', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                title: 'Task',
                task_type: 'Follow-up',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task without due date', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                title: 'Task',
                task_type: 'Follow-up',
                priority: 'medium'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task with invalid priority', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'company',
                entity_id: testCompanyId,
                title: 'Task',
                task_type: 'Follow-up',
                priority: 'invalid',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not create task with invalid entity type', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                entity_type: 'invalid',
                entity_id: testCompanyId,
                title: 'Task',
                task_type: 'Follow-up',
                priority: 'medium',
                due_date: '2024-02-01'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   LIST TASKS TESTS
========================= */

describe('List Tasks', () => {
    it('should list all tasks', async () => {
        const res = await request(app)
            .get('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toBeDefined();
    });

    it('should filter tasks by entity type', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?entityType=company')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.entityType === 'company')).toBe(true);
    });

    it('should filter tasks by entity ID', async () => {
        const res = await request(app)
            .get(`/api/v1/tasks?entityType=company&entityId=${testCompanyId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.entityId === testCompanyId)).toBe(true);
    });

    it('should filter tasks by assigned to', async () => {
        const res = await request(app)
            .get(`/api/v1/tasks?assignedTo=${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.assignedTo === userId)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?priority=high')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.priority === 'high')).toBe(true);
    });

    it('should filter tasks by completion status', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?completed=false')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.completed === false)).toBe(true);
    });

    it('should filter tasks by task type', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?taskType=Follow-up')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should search tasks by title', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?search=Follow')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should support pagination', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?page=1&limit=2')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.pagination.limit).toBe(2);
    });

    it('should support sorting', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?sortBy=dueDate&sortOrder=asc')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });
});

/* =========================
   SINGLE TASK TESTS
========================= */

describe('Get Single Task', () => {
    it('should get a task by ID', async () => {
        const res = await request(app)
            .get(`/api/v1/tasks/${testTaskId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.id).toBe(testTaskId);
        expect(res.body.data.assignedToName).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
        const res = await request(app)
            .get('/api/v1/tasks/999999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
        const res = await request(app)
            .get('/api/v1/tasks/invalid')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   UPDATE TASK TESTS
========================= */

describe('Update Task', () => {
    it('should update a task', async () => {
        const res = await request(app)
            .put(`/api/v1/tasks/${testTaskId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Updated Follow up',
                description: 'Updated description',
                priority: 'urgent',
                due_date: '2024-02-15'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.title).toBe('Updated Follow up');
        expect(res.body.data.priority).toBe('urgent');
    });

    it('should return 404 for non-existent task', async () => {
        const res = await request(app)
            .put('/api/v1/tasks/999999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Updated' });

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid priority', async () => {
        const res = await request(app)
            .put(`/api/v1/tasks/${testTaskId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ priority: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
        const res = await request(app)
            .put('/api/v1/tasks/invalid')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Updated' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   COMPLETE TASK TESTS
========================= */

describe('Complete Task', () => {
    it('should complete a task', async () => {
        const res = await request(app)
            .post(`/api/v1/tasks/${testTaskId}/complete`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ outcome: 'Successfully completed' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.completed).toBe(true);
        expect(res.body.data.completedAt).toBeDefined();
        expect(res.body.data.outcome).toBe('Successfully completed');
    });

    it('should not complete already completed task', async () => {
        const res = await request(app)
            .post(`/api/v1/tasks/${testTaskId}/complete`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/999999/complete')
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/invalid/complete')
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   BULK ASSIGN TESTS
========================= */

describe('Bulk Assign Tasks', () => {
    let bulkTaskId1: number;
    let bulkTaskId2: number;

    beforeAll(async () => {
        // Create tasks for bulk operations
        const [task1] = await db
            .insert(tasks)
            .values({
                entityType: 'company',
                entityId: testCompanyId,
                title: 'Bulk Task 1',
                taskType: 'Follow-up',
                priority: 'low',
                dueDate: new Date('2024-03-01'),
                assignedTo: userId,
                createdBy: userId,
                completed: false
            })
            .returning();
        bulkTaskId1 = task1.id;

        const [task2] = await db
            .insert(tasks)
            .values({
                entityType: 'company',
                entityId: testCompanyId,
                title: 'Bulk Task 2',
                taskType: 'Follow-up',
                priority: 'low',
                dueDate: new Date('2024-03-01'),
                assignedTo: userId,
                createdBy: userId,
                completed: false
            })
            .returning();
        bulkTaskId2 = task2.id;
    });

    it('should bulk assign tasks', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/bulk-assign')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                task_ids: [bulkTaskId1, bulkTaskId2],
                assigned_to: secondUserId
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.message).toContain('2 task(s) assigned');
    });

    it('should not bulk assign without task IDs', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/bulk-assign')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                assigned_to: secondUserId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not bulk assign without assigned_to', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/bulk-assign')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                task_ids: [bulkTaskId1]
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not bulk assign with empty task IDs array', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/bulk-assign')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                task_ids: [],
                assigned_to: secondUserId
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });

    it('should not bulk assign to non-existent user', async () => {
        const res = await request(app)
            .post('/api/v1/tasks/bulk-assign')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                task_ids: [bulkTaskId1],
                assigned_to: 999999
            });

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   TASK STATISTICS TESTS
========================= */

describe('Task Statistics', () => {
    it('should get task statistics', async () => {
        const res = await request(app)
            .get('/api/v1/tasks/stats')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.totalTasks).toBeGreaterThan(0);
        expect(res.body.data.completedTasks).toBeGreaterThanOrEqual(0);
        expect(res.body.data.overdueTasks).toBeGreaterThanOrEqual(0);
        expect(res.body.data.completionRate).toBeGreaterThanOrEqual(0);
        expect(res.body.data.byPriority).toBeDefined();
        expect(res.body.data.byType).toBeDefined();
        expect(res.body.data.byStatus).toBeDefined();
    });

    it('should filter stats by assigned to', async () => {
        const res = await request(app)
            .get(`/api/v1/tasks/stats?assignedTo=${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should filter stats by date range', async () => {
        const res = await request(app)
            .get('/api/v1/tasks/stats?dateFrom=2024-01-01&dateTo=2024-12-31')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });
});

/* =========================
   DELETE TASK TESTS
========================= */

describe('Delete Task', () => {
    let deleteTaskId: number;

    beforeAll(async () => {
        const [task] = await db
            .insert(tasks)
            .values({
                entityType: 'company',
                entityId: testCompanyId,
                title: 'Task to Delete',
                taskType: 'Follow-up',
                priority: 'low',
                dueDate: new Date('2024-03-01'),
                assignedTo: userId,
                createdBy: userId,
                completed: false
            })
            .returning();
        deleteTaskId = task.id;
    });

    it('should delete a task', async () => {
        const res = await request(app)
            .delete(`/api/v1/tasks/${deleteTaskId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
        const res = await request(app)
            .delete('/api/v1/tasks/999999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.status).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
        const res = await request(app)
            .delete('/api/v1/tasks/invalid')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.status).toBe(false);
    });
});

/* =========================
   AUTHORIZATION TESTS
========================= */

describe('Task Authorization', () => {
    it('should not allow access without token', async () => {
        const res = await request(app)
            .get('/api/v1/tasks');

        expect(res.status).toBe(401);
    });

    it('should not allow access with invalid token', async () => {
        const res = await request(app)
            .get('/api/v1/tasks')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(401);
    });
});

/* =========================
   OVERDUE TASKS TESTS
========================= */

describe('Overdue Tasks', () => {
    let overdueTaskId: number;

    beforeAll(async () => {
        // Create an overdue task (due date in the past)
        const [task] = await db
            .insert(tasks)
            .values({
                entityType: 'company',
                entityId: testCompanyId,
                title: 'Overdue Task',
                taskType: 'Follow-up',
                priority: 'high',
                dueDate: new Date('2023-01-01'), // Past date
                assignedTo: userId,
                createdBy: userId,
                completed: false
            })
            .returning();
        overdueTaskId = task.id;
    });

    it('should filter overdue tasks', async () => {
        const res = await request(app)
            .get('/api/v1/tasks?overdue=true')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.data.every((t: any) => t.completed === false)).toBe(true);
        // All tasks should have due dates in the past
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
        await db.delete(tasks).where(eq(tasks.id, overdueTaskId));
    });
});
