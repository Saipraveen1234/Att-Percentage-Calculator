import { Router } from 'express';
import {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} from '../controllers/class.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export default router;
