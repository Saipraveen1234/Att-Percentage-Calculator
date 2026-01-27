import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Calculate attendance percentage for a student
export const getStudentPercentage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { classId, startDate, endDate } = req.query;

        const where: any = {
            studentId: Number(id)
        };

        if (classId) {
            where.classId = Number(classId);
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const attendance = await prisma.attendance.findMany({
            where
        });

        const totalDays = attendance.length;
        const presentDays = attendance.filter(
            (a: any) => a.status === 'present' || a.status === 'late'
        ).length;

        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        res.json({
            studentId: Number(id),
            totalDays,
            presentDays,
            absentDays: totalDays - presentDays,
            percentage: Math.round(percentage * 100) / 100
        });
    } catch (error) {
        console.error('Get student percentage error:', error);
        res.status(500).json({ error: 'Failed to calculate attendance percentage' });
    }
};

// Get class attendance summary
export const getClassSummary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // Get all students in the class
        const students = await prisma.student.findMany({
            where: { classId: Number(id) },
            select: {
                id: true,
                rollNumber: true,
                name: true
            }
        });

        const where: any = {
            classId: Number(id)
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        // Get attendance for all students
        const attendance = await prisma.attendance.findMany({
            where
        });

        // Calculate percentage for each student
        const summary = students.map((student: any) => {
            const studentAttendance = attendance.filter(
                (a: any) => a.studentId === student.id
            );

            const totalDays = studentAttendance.length;
            const presentDays = studentAttendance.filter(
                (a: any) => a.status === 'present' || a.status === 'late'
            ).length;

            const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

            return {
                ...student,
                totalDays,
                presentDays,
                absentDays: totalDays - presentDays,
                percentage: Math.round(percentage * 100) / 100
            };
        });

        res.json({
            classId: Number(id),
            totalStudents: students.length,
            students: summary
        });
    } catch (error) {
        console.error('Get class summary error:', error);
        res.status(500).json({ error: 'Failed to generate class summary' });
    }
};

// Export attendance as CSV
export const exportCSV = async (req: Request, res: Response) => {
    try {
        const { classId, startDate, endDate } = req.query;

        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        // Get all students in the class
        const students = await prisma.student.findMany({
            where: { classId: Number(classId) },
            select: {
                id: true,
                rollNumber: true,
                name: true,
                email: true
            },
            orderBy: { rollNumber: 'asc' }
        });

        const where: any = {
            classId: Number(classId)
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        // Get attendance for all students
        const attendance = await prisma.attendance.findMany({
            where
        });

        // Build CSV
        let csv = 'Roll Number,Name,Email,Total Days,Present Days,Absent Days,Percentage\n';

        students.forEach((student: any) => {
            const studentAttendance = attendance.filter(
                (a: any) => a.studentId === student.id
            );

            const totalDays = studentAttendance.length;
            const presentDays = studentAttendance.filter(
                (a: any) => a.status === 'present' || a.status === 'late'
            ).length;
            const absentDays = totalDays - presentDays;
            const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

            csv += `${student.rollNumber},"${student.name}","${student.email || ''}",${totalDays},${presentDays},${absentDays},${percentage.toFixed(2)}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ error: 'Failed to export attendance' });
    }
};

// Get attendance analytics
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { classId, startDate, endDate } = req.query;

        if (!classId) {
            return res.status(400).json({ error: 'Class ID is required' });
        }

        const where: any = {
            classId: Number(classId)
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        // Get all attendance records
        const attendance = await prisma.attendance.findMany({
            where,
            orderBy: { date: 'asc' }
        });

        // Group by date
        const dateMap = new Map<string, { present: number; absent: number; total: number }>();

        attendance.forEach((record: any) => {
            const dateStr = record.date.toISOString().split('T')[0];
            const existing = dateMap.get(dateStr) || { present: 0, absent: 0, total: 0 };

            if (record.status === 'present' || record.status === 'late') {
                existing.present++;
            } else {
                existing.absent++;
            }
            existing.total++;

            dateMap.set(dateStr, existing);
        });

        // Convert to array
        const dailyStats = Array.from(dateMap.entries()).map(([date, stats]) => ({
            date,
            present: stats.present,
            absent: stats.absent,
            total: stats.total,
            percentage: (stats.present / stats.total) * 100
        }));

        res.json({
            classId: Number(classId),
            dailyStats
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
};
