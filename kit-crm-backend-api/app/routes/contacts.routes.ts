import express, { Router } from 'express';
import {
    getContacts,
    getContact,
    getContactsByCompany,
    createContact,
    updateContact,
    deleteContact
} from '../controllers/contacts.controller';

const router: Router = express.Router();

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

// Special route for getting all contacts by company
router.get('/company/:companyId', getContactsByCompany);

export default router;
