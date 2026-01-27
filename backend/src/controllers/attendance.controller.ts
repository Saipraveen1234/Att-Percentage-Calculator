import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const markAttendance = async (req: any, res: Response) => {
    try {
        const { classId, date, records } = req.body;

        if (!classId || !date || !records || !Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const dateString = Array.isArray(date) ? date[0] : date;
        const attendanceDate = new Date(dateString);
        const markedBy = req.user.id;

        // Bulk create/update attendance records
        const results = await Promise.all(
            records.map(async (record: { studentId: number; status: string }) => {
                return prisma.attendance.upsert({
                    where: {
                        studentId_classId_date: {
                            studentId: record.studentId,
                            classId: Number(classId),
                            date: attendanceDate
                        }
                    },
                    update: {
                        status: record.status,
                        markedBy
                    },
                    create: {
                        studentId: record.studentId,
                        classId: Number(classId),
                        date: attendanceDate,
                        status: record.status,
                        markedBy
                    }
                });
            })
        );

        res.json({
            message: 'Attendance marked successfully',
            count: results.length
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

export const getAttendanceByDate = async (req: Request, res: Response) => {
    try {
        const { date } = req.params;
        const { classId } = req.query;

        const dateString = Array.isArray(date) ? date[0] : date;
        const where: any = {
            date: new Date(dateString)
        };

        if (classId) {
            where.classId = Number(classId);
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        rollNumber: true,
                        name: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        subject: true
                    }
                }
            },
            orderBy: {
                student: {
                    rollNumber: 'asc'
                }
            }
        });

        res.json(attendance);
    } catch (error) {
        console.error('Get attendance by date error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const where: any = {
            studentId: Number(id)
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const attendance = await prisma.attendance.findMany({
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
            orderBy: { date: 'desc' }
        });

        res.json(attendance);
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch student attendance' });
    }
};

export const updateAttendance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const attendance = await prisma.attendance.update({
            where: { id: Number(id) },
            data: { status }
        });

        res.json(attendance);
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
};

export const getClassAttendanceRange = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.query;

        const where: any = {
            classId: Number(classId)
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        rollNumber: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { date: 'desc' },
                { student: { rollNumber: 'asc' } }
            ]
        });

        res.json(attendance);
    } catch (error) {
        console.error('Get class attendance range error:', error);
        res.status(500).json({ error: 'Failed to fetch class attendance' });
    }
};
