import express, { Router } from 'express';
import {
    getDataSources,
    getDataSource,
    createDataSource,
    updateDataSource,
    deleteDataSource
} from '../controllers/dataSources.controller';

const router: Router = express.Router();

router.get('/', getDataSources);
router.get('/:id', getDataSource);
router.post('/', createDataSource);
router.put('/:id', updateDataSource);
router.delete('/:id', deleteDataSource);

export default router;
