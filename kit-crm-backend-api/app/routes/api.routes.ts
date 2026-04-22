import express, { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import profileRoutes from './profile.routes';
import optionsRoutes from './options.routes';
import rolesRoutes from './roles.routes';
import companiesRoutes from './companies.routes';
import contactsRoutes from './contacts.routes';
import dataSourcesRoutes from './dataSources.routes';
import dataImportsRoutes from './dataImports.routes';
import leadConfigRoutes from './leadConfig.routes';
import leadsRoutes from './leads.routes';
import opportunitiesRoutes from './opportunities.routes';
import dealsRoutes from './deals.routes';
import activitiesRoutes from './activities.routes';
import tasksRoutes from './tasks.routes';
import notesRoutes from './notes.routes';
import stageHistoryRoutes from './stageHistory.routes';
import { verifyToken} from '../middlewares/auth.middleware';

const router: Router = express.Router();

// Auth routes (public)
router.use('/auth', authRoutes);

// Admin-only routes
router.use('/users', verifyToken, usersRoutes);

// Protected routes (require authentication)
router.use('/profile', verifyToken, profileRoutes);
router.use('/options', verifyToken, optionsRoutes);
router.use('/roles', verifyToken, rolesRoutes);

// CRM routes (require authentication)
router.use('/companies', verifyToken, companiesRoutes);
router.use('/contacts', verifyToken, contactsRoutes);
router.use('/data-sources', verifyToken, dataSourcesRoutes);
router.use('/data-imports', verifyToken, dataImportsRoutes);
router.use('/lead-config', verifyToken, leadConfigRoutes);
router.use('/leads', verifyToken, leadsRoutes);
router.use('/opportunities', verifyToken, opportunitiesRoutes);
router.use('/deals', verifyToken, dealsRoutes);
router.use('/activities', verifyToken, activitiesRoutes);
router.use('/tasks', verifyToken, tasksRoutes);
router.use('/notes', verifyToken, notesRoutes);
router.use('/stage-history', verifyToken, stageHistoryRoutes);

export default router;