import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import multer from 'multer';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

export const getAllStudents = async (req: any, res: Response) => {
    try {
        const { classId, search, page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            class: {
                teacherId: req.user.id
            }
        };

        if (classId) {
            where.classId = Number(classId);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
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
                skip,
                take: Number(limit),
                orderBy: { rollNumber: 'asc' }
            }),
            prisma.student.count({ where })
        ]);

        res.json({
            students,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

export const getStudentById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id: Number(id) },
            include: {
                class: true,
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Verify ownership
        if (student.class.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(student);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

export const createStudent = async (req: any, res: Response) => {
    try {
        const { rollNumber, name, email, classId, group } = req.body;

        if (!rollNumber || !name || !classId) {
            return res.status(400).json({ error: 'Roll number, name, and class are required' });
        }

        // Verify class ownership
        const classData = await prisma.class.findUnique({
            where: { id: Number(classId) }
        });

        if (!classData || classData.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'You can only add students to your own classes' });
        }

        // Check for duplicate roll number
        const existing = await prisma.student.findUnique({
            where: { rollNumber }
        });

        if (existing) {
            return res.status(400).json({ error: 'Roll number already exists' });
        }

        const student = await prisma.student.create({
            data: {
                rollNumber,
                name,
                email,
                group: group || null,
                classId: Number(classId)
            },
            include: {
                class: true
            }
        });

        res.status(201).json(student);
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
};

export const updateStudent = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { rollNumber, name, email, classId } = req.body;

        // Verify ownership
        const existingStudent = await prisma.student.findUnique({
            where: { id: Number(id) },
            include: { class: true }
        });

        if (!existingStudent) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (existingStudent.class.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // If moving to another class, verify target class ownership
        if (classId) {
            const newClass = await prisma.class.findUnique({ where: { id: Number(classId) } });
            if (!newClass || newClass.teacherId !== req.user.id) {
                return res.status(403).json({ error: 'Cannot move student to another teacher\'s class' });
            }
        }

        const student = await prisma.student.update({
            where: { id: Number(id) },
            data: {
                ...(rollNumber && { rollNumber }),
                ...(name && { name }),
                ...(email !== undefined && { email }),
                ...(classId && { classId: Number(classId) })
            },
            include: {
                class: true
            }
        });

        res.json(student);
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

export const deleteStudent = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const student = await prisma.student.findUnique({
            where: { id: Number(id) },
            include: { class: true }
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student.class.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.student.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};

// Bulk import from CSV/Excel
export const importStudents = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { classId, group } = req.body;
        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        // Verify class ownership
        const classData = await prisma.class.findUnique({ where: { id: Number(classId) } });
        if (!classData || classData.teacherId !== req.user.id) {
            // Clean up uploaded file
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'You can only import students to your own classes' });
        }

        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const students: any[] = [];
        const errors: any[] = [];

        // Parse CSV
        if (ext === '.csv') {
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        // Map college Excel format columns
                        const registrationNo = row['Regd.No.'] || row['Regd.No'] || row['Registration No'] || row['registration_no'] || null;
                        const admissionNo = row['Admn.No.'] || row['Admn.No'] || row['Admission No'] || row['admission_no'] || null;
                        const name = row['Name of the Student'] || row['Name'] || row['name'];
                        const gender = row['G'] || row['Gender'] || row['gender'] || null;
                        const secondLanguage = row['SL'] || row['Second Language'] || row['second_language'] || null;

                        // Use Regd.No. as roll number, fallback to Admn.No.
                        const rollNumber = registrationNo ? String(registrationNo) : (admissionNo ? String(admissionNo) : null);

                        students.push({
                            registrationNo: registrationNo ? String(registrationNo) : null,
                            rollNumber,
                            admissionNo: admissionNo ? String(admissionNo) : null,
                            name,
                            gender: gender ? String(gender) : null,
                            secondLanguage: secondLanguage ? String(secondLanguage) : null
                        });
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        }
        // Parse Excel
        else if (ext === '.xlsx' || ext === '.xls') {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with range option to skip first 3 rows
            // Row 4 (index 3) contains the actual headers
            const data = XLSX.utils.sheet_to_json(worksheet, {
                range: 3  // Skip first 3 rows (0, 1, 2), start from row 4 (index 3)
            });

            console.log('Excel headers detected:', Object.keys(data[0] || {}));

            data.forEach((row: any) => {
                // Map college Excel format columns
                // R.No. is just serial number, not roll number
                // Regd.No. is the actual registration/roll number
                const registrationNo = row['Regd.No.'] || row['Regd.No'] || row['Registration No'] || row['registration_no'] || null;
                const admissionNo = row['Admn.No.'] || row['Admn.No'] || row['Admission No'] || row['admission_no'] || null;
                const name = row['Name of the Student'] || row['Name'] || row['name'];
                const gender = row['G'] || row['Gender'] || row['gender'] || null;
                const secondLanguage = row['SL'] || row['Second Language'] || row['second_language'] || null;

                // Use Regd.No. as roll number (convert to string), fallback to Admn.No.
                const rollNumber = registrationNo ? String(registrationNo) : (admissionNo ? String(admissionNo) : null);

                students.push({
                    registrationNo: registrationNo ? String(registrationNo) : null,
                    rollNumber,
                    admissionNo: admissionNo ? String(admissionNo) : null,
                    name,
                    gender: gender ? String(gender) : null,
                    secondLanguage: secondLanguage ? String(secondLanguage) : null
                });
            });
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Invalid file format. Only CSV and Excel files are supported' });
        }

        // Log first few students for debugging
        console.log('Parsed students (first 3):', students.slice(0, 3));

        // Validate and insert students
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];

            // Skip empty rows
            if (!student.name && !student.rollNumber) {
                continue;
            }

            // Validation - only name is required, rollNumber can be auto-generated
            if (!student.name) {
                errors.push({
                    row: i + 1,
                    data: student,
                    error: 'Missing required field: Name'
                });
                failedCount++;
                continue;
            }

            // If no rollNumber, use admission number or generate one
            if (!student.rollNumber) {
                student.rollNumber = student.admissionNo || student.registrationNo || `STUDENT-${Date.now()}-${i}`;
            }

            try {
                // Check for duplicate
                const existing = await prisma.student.findUnique({
                    where: { rollNumber: student.rollNumber }
                });

                if (existing) {
                    errors.push({
                        row: i + 1,
                        data: student,
                        error: 'Duplicate roll number'
                    });
                    failedCount++;
                    continue;
                }

                // Create student
                await prisma.student.create({
                    data: {
                        registrationNo: student.registrationNo,
                        rollNumber: student.rollNumber,
                        admissionNo: student.admissionNo,
                        name: student.name,
                        email: student.email || null,
                        gender: student.gender,
                        secondLanguage: student.secondLanguage,
                        group: group || null,
                        classId: Number(classId)
                    }
                });

                successCount++;
            } catch (error: any) {
                errors.push({
                    row: i + 1,
                    data: student,
                    error: error.message
                });
                failedCount++;
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            message: 'Import completed',
            success: successCount,
            failed: failedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Import students error:', error);
        // Clean up file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to import students' });
    }
};

export const uploadMiddleware = upload.single('file');
