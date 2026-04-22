import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import {
    deals,
    opportunities,
    opportunityStages,
    leads,
    leadStatuses,
    companies,
    companyContacts,
    dataSources
} from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

describe('Deals API', () => {
    let authToken: string;
    let userId: number;
    let testCompanyId: number;
    let testContactId: number;
    let testLeadId: number;
    let testDataSourceId: number;
    let testLeadStatusId: number;
    let testStageId: number;
    let testOpportunityId: number;
    let testDealId: number;

    beforeAll(async () => {
        authToken = await getAuthToken();

        // Get current user
        const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
        userId = tokenPayload.userId;

        // Create test data source
        const [dataSource] = await db
            .insert(dataSources)
            .values({
                name: `Test DS Deals ${Date.now()}`
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
                name: `Test Company Deals ${Date.now()}`,
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
                name: `Won Stage ${Date.now()}`,
                probability: 100,
                order: 99,
                isActive: true
            })
            .returning();
        testStageId = stage.id;

        // Create test opportunity
        const [opportunity] = await db
            .insert(opportunities)
            .values({
                createdBy: userId,
                leadId: testLeadId,
                stageId: testStageId,
                expectedValue: '100000',
                probability: 100
            })
            .returning();
        testOpportunityId = opportunity.id;
    });

    afterAll(async () => {
        // Cleanup in reverse order
        if (testDealId) {
            await db.delete(deals).where(eq(deals.id, testDealId));
        }
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

    /* ==================== DEALS ==================== */

    describe('POST /api/v1/deals - Create Deal', () => {
        test('should create a new deal', async () => {
            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_id: testOpportunityId,
                    deal_value: 95000,
                    status: 'won',
                    payment_terms: '30 days net',
                    contract_start_date: '2026-03-01',
                    contract_end_date: '2027-03-01',
                    closed_date: '2026-02-25'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.opportunityId).toBe(testOpportunityId);
            expect(response.body.data.status).toBe('won');
            expect(response.body.data.createdBy).toBe(userId);

            testDealId = response.body.data.id;
        });

        test('should return 400 when opportunity_id is missing', async () => {
            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_value: 50000
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toContain('Opportunity ID');
        });

        test('should return 400 when deal_value is missing', async () => {
            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_id: testOpportunityId
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toContain('deal value');
        });

        test('should return 400 for invalid deal_value', async () => {
            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_id: testOpportunityId,
                    deal_value: -1000
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });

        test('should return 404 for non-existent opportunity', async () => {
            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_id: 999999,
                    deal_value: 50000
                });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
            expect(response.body.message).toContain('Opportunity not found');
        });

        test('should create deal with default pending status', async () => {
            const [tempOpp] = await db
                .insert(opportunities)
                .values({
                    createdBy: userId,
                    leadId: testLeadId,
                    stageId: testStageId
                })
                .returning();

            const response = await request(app)
                .post('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    opportunity_id: tempOpp.id,
                    deal_value: 25000
                });

            expect(response.status).toBe(201);
            expect(response.body.data.status).toBe('pending');

            // Cleanup
            await db.delete(deals).where(eq(deals.id, response.body.data.id));
            await db.delete(opportunities).where(eq(opportunities.id, tempOpp.id));
        });
    });

    describe('GET /api/v1/deals - List Deals', () => {
        test('should get all deals', async () => {
            const response = await request(app)
                .get('/api/v1/deals')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });

        test('should filter by opportunityId', async () => {
            const response = await request(app)
                .get(`/api/v1/deals?opportunityId=${testOpportunityId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            if (response.body.data.length > 0) {
                expect(response.body.data[0].opportunityId).toBe(testOpportunityId);
            }
        });

        test('should filter by status', async () => {
            const response = await request(app)
                .get('/api/v1/deals?status=won')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should filter by deal value range', async () => {
            const response = await request(app)
                .get('/api/v1/deals?minValue=50000&maxValue=150000')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should filter by createdBy', async () => {
            const response = await request(app)
                .get(`/api/v1/deals?createdBy=${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/v1/deals?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        test('should support sorting', async () => {
            const response = await request(app)
                .get('/api/v1/deals?sortBy=dealValue&sortOrder=desc')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });
    });

    describe('GET /api/v1/deals/:id - Get Single Deal', () => {
        test('should get a specific deal', async () => {
            const response = await request(app)
                .get(`/api/v1/deals/${testDealId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.id).toBe(testDealId);
            expect(response.body.data).toHaveProperty('companyName');
            expect(response.body.data).toHaveProperty('contactName');
        });

        test('should return 404 for non-existent deal', async () => {
            const response = await request(app)
                .get('/api/v1/deals/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 for invalid ID', async () => {
            const response = await request(app)
                .get('/api/v1/deals/invalid')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });
    });

    describe('PUT /api/v1/deals/:id - Update Deal', () => {
        test('should update a deal', async () => {
            const response = await request(app)
                .put(`/api/v1/deals/${testDealId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_value: 97500,
                    payment_terms: 'Net 45 days'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data.paymentTerms).toBe('Net 45 days');
        });

        test('should update deal status', async () => {
            const [tempDeal] = await db
                .insert(deals)
                .values({
                    opportunityId: testOpportunityId,
                    createdBy: userId,
                    dealValue: '50000',
                    status: 'pending'
                })
                .returning();

            const response = await request(app)
                .put(`/api/v1/deals/${tempDeal.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'won',
                    closed_date: '2026-02-25'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('won');

            // Cleanup
            await db.delete(deals).where(eq(deals.id, tempDeal.id));
        });

        test('should return 404 for non-existent deal', async () => {
            const response = await request(app)
                .put('/api/v1/deals/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_value: 100000
                });

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 for invalid deal value', async () => {
            const response = await request(app)
                .put(`/api/v1/deals/${testDealId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_value: -5000
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/deals/stats - Get Deal Statistics', () => {
        test('should get deal statistics', async () => {
            const response = await request(app)
                .get('/api/v1/deals/stats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.data).toHaveProperty('totalDeals');
            expect(response.body.data).toHaveProperty('totalValue');
            expect(response.body.data).toHaveProperty('wonDeals');
            expect(response.body.data).toHaveProperty('lostDeals');
            expect(response.body.data).toHaveProperty('pendingDeals');
            expect(response.body.data).toHaveProperty('averageDealValue');
        });

        test('should filter stats by createdBy', async () => {
            const response = await request(app)
                .get(`/api/v1/deals/stats?createdBy=${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });

        test('should filter stats by date range', async () => {
            const response = await request(app)
                .get('/api/v1/deals/stats?dateFrom=2026-01-01&dateTo=2026-12-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
        });
    });

    describe('POST /api/v1/deals/bulk-update - Bulk Update Deals', () => {
        let tempDealIds: number[] = [];

        beforeAll(async () => {
            // Create test deals for bulk update
            for (let i = 0; i < 2; i++) {
                const [deal] = await db
                    .insert(deals)
                    .values({
                        opportunityId: testOpportunityId,
                        createdBy: userId,
                        dealValue: '30000',
                        status: 'pending'
                    })
                    .returning();
                tempDealIds.push(deal.id);
            }
        });

        afterAll(async () => {
            // Cleanup
            for (const id of tempDealIds) {
                await db.delete(deals).where(eq(deals.id, id));
            }
        });

        test('should bulk update deal status', async () => {
            const response = await request(app)
                .post('/api/v1/deals/bulk-update')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_ids: tempDealIds,
                    status: 'won'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);
            expect(response.body.message).toContain('2 deals updated');
        });

        test('should return 400 when deal_ids is missing', async () => {
            const response = await request(app)
                .post('/api/v1/deals/bulk-update')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'won'
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });

        test('should return 400 when no update field provided', async () => {
            const response = await request(app)
                .post('/api/v1/deals/bulk-update')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deal_ids: tempDealIds
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe(false);
        });
    });

    describe('DELETE /api/v1/deals/:id - Delete Deal', () => {
        test('should delete a deal', async () => {
            const [tempDeal] = await db
                .insert(deals)
                .values({
                    opportunityId: testOpportunityId,
                    createdBy: userId,
                    dealValue: '10000',
                    status: 'lost'
                })
                .returning();

            const response = await request(app)
                .delete(`/api/v1/deals/${tempDeal.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe(true);

            // Verify deletion
            const deleted = await db
                .select()
                .from(deals)
                .where(eq(deals.id, tempDeal.id));

            expect(deleted.length).toBe(0);
        });

        test('should return 404 for non-existent deal', async () => {
            const response = await request(app)
                .delete('/api/v1/deals/999999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.status).toBe(false);
        });
    });

    describe('Authorization', () => {
        test('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/v1/deals');

            expect(response.status).toBe(401);
        });

        test('should return 401 for invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/deals')
                .set('Authorization', 'Bearer invalid_token');

            expect(response.status).toBe(401);
        });
    });
});
