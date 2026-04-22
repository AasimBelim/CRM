import express, { Router } from 'express';
import { getUsers, getUser, addUser, updateUser, deleteUser } from '../controllers/users.controller';
import { isAdmin } from '../middlewares/auth.middleware';

const router: Router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', isAdmin, addUser);
router.put('/:id', isAdmin, updateUser);
router.delete('/:id', isAdmin, deleteUser);

export default router;
