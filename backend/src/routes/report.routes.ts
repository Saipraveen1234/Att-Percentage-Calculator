import { Router } from 'express';
import {
    getStudentPercentage,
    getClassSummary,
    exportCSV,
    getAnalytics
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/student/:id/percentage', getStudentPercentage);
router.get('/class/:id/summary', getClassSummary);
router.get('/export/csv', exportCSV);
router.get('/analytics', getAnalytics);

export default router;
