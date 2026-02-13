import { Router } from 'express';
import multer from 'multer';
import {
    createExamMark,
    updateExamMark,
    deleteExamMark,
    getExamMarksByStudent,
    getExamMarksByClass,
    getExamMarkStats,
    processMarkSheetOCR
} from '../controllers/exam-mark.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for image upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// All routes require authentication
router.post('/', authenticate, createExamMark);
router.put('/:id', authenticate, updateExamMark);
router.delete('/:id', authenticate, deleteExamMark);
router.get('/student/:studentId', authenticate, getExamMarksByStudent);
router.get('/class/:classId', authenticate, getExamMarksByClass);
router.get('/class/:classId/stats', authenticate, getExamMarkStats);

// OCR route for mark sheet image upload
router.post('/ocr', authenticate, upload.single('image'), processMarkSheetOCR);

export default router;

