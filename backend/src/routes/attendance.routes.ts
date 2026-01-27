import { Router } from 'express';
import {
    markAttendance,
    getAttendanceByDate,
    getStudentAttendance,
    updateAttendance,
    getClassAttendanceRange
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', markAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/student/:id', getStudentAttendance);
router.put('/:id', updateAttendance);
router.get('/class/:classId/range', getClassAttendanceRange);

export default router;
