import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { geminiService } from '../services/gemini.service';

// Create exam mark
export const createExamMark = async (req: any, res: Response) => {
    try {
        const { studentId, classId, semester, examType, marks, academicYear } = req.body;

        // Validation
        if (!studentId || !classId || !semester || !examType || marks === undefined || !academicYear) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate marks (max 28)
        if (marks < 0 || marks > 28) {
            return res.status(400).json({ error: 'Marks must be between 0 and 28' });
        }

        // Validate semester
        if (!['semester1', 'semester2'].includes(semester)) {
            return res.status(400).json({ error: 'Semester must be semester1 or semester2' });
        }

        // Validate exam type
        if (!['mid1', 'mid2'].includes(examType)) {
            return res.status(400).json({ error: 'Exam type must be mid1 or mid2' });
        }

        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: parseInt(studentId) }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if class exists
        const classData = await prisma.class.findUnique({
            where: { id: parseInt(classId) }
        });

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Create exam mark
        const examMark = await prisma.examMark.create({
            data: {
                studentId: parseInt(studentId),
                classId: parseInt(classId),
                semester,
                examType,
                marks: parseFloat(marks),
                academicYear,
                markedBy: req.user.id
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Exam mark created successfully',
            examMark
        });
    } catch (error: any) {
        console.error('Create exam mark error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Exam mark already exists for this student, class, semester, and exam type' });
        }
        res.status(500).json({ error: 'Failed to create exam mark' });
    }
};

// Update exam mark
export const updateExamMark = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { marks } = req.body;

        // Validate marks (max 28)
        if (marks < 0 || marks > 28) {
            return res.status(400).json({ error: 'Marks must be between 0 and 28' });
        }

        const examMark = await prisma.examMark.update({
            where: { id: parseInt(Array.isArray(id) ? id[0] : id) },
            data: { marks: parseFloat(marks) },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true
                    }
                }
            }
        });

        res.json({
            message: 'Exam mark updated successfully',
            examMark
        });
    } catch (error: any) {
        console.error('Update exam mark error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Exam mark not found' });
        }
        res.status(500).json({ error: 'Failed to update exam mark' });
    }
};

// Delete exam mark
export const deleteExamMark = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.examMark.delete({
            where: { id: parseInt(Array.isArray(id) ? id[0] : id) }
        });

        res.json({ message: 'Exam mark deleted successfully' });
    } catch (error: any) {
        console.error('Delete exam mark error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Exam mark not found' });
        }
        res.status(500).json({ error: 'Failed to delete exam mark' });
    }
};

// Get exam marks by student
export const getExamMarksByStudent = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { academicYear, semester } = req.query;

        const where: any = {
            studentId: parseInt(Array.isArray(studentId) ? studentId[0] : studentId)
        };

        if (academicYear) {
            where.academicYear = academicYear;
        }

        if (semester) {
            where.semester = semester;
        }

        const examMarks = await prisma.examMark.findMany({
            where,
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true
                    }
                }
            },
            orderBy: [
                { academicYear: 'desc' },
                { semester: 'asc' },
                { examType: 'asc' }
            ]
        });

        res.json(examMarks);
    } catch (error) {
        console.error('Get exam marks by student error:', error);
        res.status(500).json({ error: 'Failed to get exam marks' });
    }
};

// Get exam marks by class
export const getExamMarksByClass = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { academicYear, semester, examType } = req.query;

        const where: any = {
            classId: parseInt(Array.isArray(classId) ? classId[0] : classId)
        };

        if (academicYear) {
            where.academicYear = academicYear;
        }

        if (semester) {
            where.semester = semester;
        }

        if (examType) {
            where.examType = examType;
        }

        const examMarks = await prisma.examMark.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true
                    }
                }
            },
            orderBy: [
                { student: { rollNumber: 'asc' } }
            ]
        });

        res.json(examMarks);
    } catch (error) {
        console.error('Get exam marks by class error:', error);
        res.status(500).json({ error: 'Failed to get exam marks' });
    }
};

// Get exam mark statistics for a class
export const getExamMarkStats = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { academicYear, semester } = req.query;

        const where: any = {
            classId: parseInt(Array.isArray(classId) ? classId[0] : classId)
        };

        if (academicYear) {
            where.academicYear = academicYear;
        }

        if (semester) {
            where.semester = semester;
        }

        const examMarks = await prisma.examMark.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true
                    }
                }
            }
        });

        if (examMarks.length === 0) {
            return res.json({
                totalStudents: 0,
                averageMarks: 0,
                highestMarks: 0,
                lowestMarks: 0,
                passCount: 0,
                failCount: 0,
                passPercentage: 0
            });
        }

        // Calculate statistics
        const marks = examMarks.map(em => em.marks);
        const totalMarks = marks.reduce((sum, mark) => sum + mark, 0);
        const averageMarks = totalMarks / marks.length;
        const highestMarks = Math.max(...marks);
        const lowestMarks = Math.min(...marks);

        // Calculate pass/fail (assuming pass mark is 14 out of 28, i.e., 50%)
        const passMarks = 14;
        const passCount = marks.filter(mark => mark >= passMarks).length;
        const failCount = marks.filter(mark => mark < passMarks).length;
        const passPercentage = (passCount / marks.length) * 100;

        // Group by student to calculate semester averages
        const studentAverages: any = {};
        examMarks.forEach(em => {
            const key = `${em.studentId}-${em.semester}-${em.academicYear}`;
            if (!studentAverages[key]) {
                studentAverages[key] = {
                    student: em.student,
                    semester: em.semester,
                    academicYear: em.academicYear,
                    marks: []
                };
            }
            studentAverages[key].marks.push(em.marks);
        });

        // Calculate average for each student (average of mid1 and mid2)
        const studentResults = Object.values(studentAverages).map((sa: any) => {
            const avg = sa.marks.reduce((sum: number, m: number) => sum + m, 0) / sa.marks.length;
            return {
                student: sa.student,
                semester: sa.semester,
                academicYear: sa.academicYear,
                average: avg,
                status: avg >= passMarks ? 'pass' : 'fail'
            };
        });

        res.json({
            totalStudents: examMarks.length,
            averageMarks: parseFloat(averageMarks.toFixed(2)),
            highestMarks,
            lowestMarks,
            passCount,
            failCount,
            passPercentage: parseFloat(passPercentage.toFixed(2)),
            studentResults
        });
    } catch (error) {
        console.error('Get exam mark stats error:', error);
        res.status(500).json({ error: 'Failed to get exam mark statistics' });
    }
};

// Process mark sheet image with OCR
export const processMarkSheetOCR = async (req: any, res: Response) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imageBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // Validate image type
        if (!mimeType.startsWith('image/')) {
            return res.status(400).json({ error: 'File must be an image' });
        }

        // Process image with Gemini Vision API
        const extractedData = await geminiService.extractMarkSheetData(imageBuffer, mimeType);

        // Return extracted data
        res.json({
            success: true,
            data: extractedData,
            count: extractedData.length
        });
    } catch (error: any) {
        console.error('OCR processing error:', error);
        res.status(500).json({
            error: 'Failed to process mark sheet image',
            message: error.message
        });
    }
};
