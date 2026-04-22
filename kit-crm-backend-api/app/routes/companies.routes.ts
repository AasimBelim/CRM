import express, { Router } from 'express';
import {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    bulkAssignCompanies
} from '../controllers/companies.controller';

const router: Router = express.Router();

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.post('/bulk-assign', bulkAssignCompanies);

export default router;
