import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server';
import db from '../../db/db';
import { notes, companies, leads, opportunities, opportunityStages, leadStatuses } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getAuthToken } from '../helpers/testUtils';

let adminToken: string;
let userId: number;
let companyId: number;
let leadId: number;
let opportunityId: number;
let noteId: number;
let stageId: number;
let leadStatusId: number;

describe('Notes API', () => {
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
                name: `Test Note Company ${Date.now()}`,
                industry: 'Technology',
                website: `https://testnote${Date.now()}.com`,
                domain: `testnote${Date.now()}.com`,
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
                expectedValue: '50000',
                description: 'Test opportunity for notes'
            })
            .returning();
        opportunityId = opportunity.id;
    });

    afterAll(async () => {
        // Clean up test data
        if (noteId) {
            await db.delete(notes).where(eq(notes.id, noteId));
        }
        await db.delete(notes).where(eq(notes.createdBy, userId));
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

    describe('POST /api/v1/notes', () => {
        test('should create a note for a company', async () => {
            const res = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'company',
                    entity_id: companyId,
                    content: 'This is a test note for the company'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.entityType).toBe('company');
            expect(res.body.data.entityId).toBe(companyId);
            expect(res.body.data.content).toBe('This is a test note for the company');
            expect(res.body.data.createdBy).toBe(userId);
            expect(res.body.data.isPinned).toBe(false);

            noteId = res.body.data.id;
        });

        test('should create a note for a lead', async () => {
            const res = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'lead',
                    entity_id: leadId,
                    content: 'This is a test note for the lead'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data.entityType).toBe('lead');
            expect(res.body.data.entityId).toBe(leadId);
        });

        test('should create a note for an opportunity', async () => {
            const res = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'opportunity',
                    entity_id: opportunityId,
                    content: 'This is a test note for the opportunity'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe(true);
            expect(res.body.data.entityType).toBe('opportunity');
            expect(res.body.data.entityId).toBe(opportunityId);
        });

        test('should fail with invalid entity type', async () => {
            const res = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'invalid',
                    entity_id: companyId,
                    content: 'Test note'
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });

        test('should fail without content', async () => {
            const res = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'company',
                    entity_id: companyId
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('GET /api/v1/notes', () => {
        test('should retrieve all notes', async () => {
            const res = await request(app)
                .get('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
        });

        test('should filter notes by entity type', async () => {
            const res = await request(app)
                .get('/api/v1/notes?entityType=company')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.every((note: any) => note.entityType === 'company')).toBe(true);
        });

        test('should filter notes by entity ID', async () => {
            const res = await request(app)
                .get(`/api/v1/notes?entityType=company&entityId=${companyId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.every((note: any) => note.entityId === companyId)).toBe(true);
        });

        test('should filter notes by pinned status', async () => {
            const res = await request(app)
                .get('/api/v1/notes?isPinned=true')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should search notes by content', async () => {
            const res = await request(app)
                .get('/api/v1/notes?search=test note')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });
    });

    describe('GET /api/v1/notes/:id', () => {
        test('should retrieve a single note', async () => {
            const res = await request(app)
                .get(`/api/v1/notes/${noteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.id).toBe(noteId);
            expect(res.body.data).toHaveProperty('createdByName');
            expect(res.body.data).toHaveProperty('createdByEmail');
        });

        test('should return 404 for non-existent note', async () => {
            const res = await request(app)
                .get('/api/v1/notes/999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.status).toBe(false);
        });

        test('should return 400 for invalid note ID', async () => {
            const res = await request(app)
                .get('/api/v1/notes/invalid')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('PUT /api/v1/notes/:id', () => {
        test('should update note content', async () => {
            const res = await request(app)
                .put(`/api/v1/notes/${noteId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    content: 'Updated note content'
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.content).toBe('Updated note content');
        });

        test('should update note pinned status', async () => {
            const res = await request(app)
                .put(`/api/v1/notes/${noteId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    is_pinned: true
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.isPinned).toBe(true);
        });

        test('should return 404 for non-existent note', async () => {
            const res = await request(app)
                .put('/api/v1/notes/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    content: 'Updated content'
                });

            expect(res.status).toBe(404);
            expect(res.body.status).toBe(false);
        });
    });

    describe('POST /api/v1/notes/:id/pin', () => {
        test('should pin a note', async () => {
            const res = await request(app)
                .post(`/api/v1/notes/${noteId}/pin`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    is_pinned: true
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.isPinned).toBe(true);
        });

        test('should unpin a note', async () => {
            const res = await request(app)
                .post(`/api/v1/notes/${noteId}/pin`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    is_pinned: false
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.isPinned).toBe(false);
        });

        test('should return 404 for non-existent note', async () => {
            const res = await request(app)
                .post('/api/v1/notes/999999/pin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    is_pinned: true
                });

            expect(res.status).toBe(404);
            expect(res.body.status).toBe(false);
        });
    });

    describe('DELETE /api/v1/notes/:id', () => {
        test('should delete a note', async () => {
            // Create a note to delete
            const createRes = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'company',
                    entity_id: companyId,
                    content: 'Note to be deleted'
                });

            const deleteNoteId = createRes.body.data.id;

            const res = await request(app)
                .delete(`/api/v1/notes/${deleteNoteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
        });

        test('should return 404 for non-existent note', async () => {
            const res = await request(app)
                .delete('/api/v1/notes/999999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.status).toBe(false);
        });
    });

    describe('POST /api/v1/notes/bulk-delete', () => {
        test('should bulk delete notes', async () => {
            // Create multiple notes
            const note1 = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'company',
                    entity_id: companyId,
                    content: 'Bulk delete note 1'
                });

            const note2 = await request(app)
                .post('/api/v1/notes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    entity_type: 'company',
                    entity_id: companyId,
                    content: 'Bulk delete note 2'
                });

            const noteIds = [note1.body.data.id, note2.body.data.id];

            const res = await request(app)
                .post('/api/v1/notes/bulk-delete')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    note_ids: noteIds
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.deletedCount).toBeGreaterThan(0);
        });

        test('should fail without note_ids', async () => {
            const res = await request(app)
                .post('/api/v1/notes/bulk-delete')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });

        test('should fail with empty note_ids array', async () => {
            const res = await request(app)
                .post('/api/v1/notes/bulk-delete')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    note_ids: []
                });

            expect(res.status).toBe(400);
            expect(res.body.status).toBe(false);
        });
    });

    describe('Authorization', () => {
        test('should fail without token', async () => {
            const res = await request(app)
                .get('/api/v1/notes');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe(false);
        });

        test('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/notes')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.status).toBe(401);
            expect(res.body.status).toBe(false);
        });
    });
});
