import express, { Router } from 'express';
import {
    getDataImports,
    getDataImport,
    createDataImport,
    updateDataImport
} from '../controllers/dataImports.controller';

const router: Router = express.Router();

router.get('/', getDataImports);
router.get('/:id', getDataImport);
router.post('/', createDataImport);
router.put('/:id', updateDataImport);

export default router;
