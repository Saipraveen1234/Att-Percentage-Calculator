import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllClasses = async (req: any, res: Response) => {
    try {
        // Filter classes by authenticated teacher
        const classes = await prisma.class.findMany({
            where: {
                teacherId: req.user.id
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        students: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(classes);
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
};

export const getClassById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        const classData = await prisma.class.findUnique({
            where: { id: Number(id) },
            include: {
                teacher: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                students: {
                    orderBy: { rollNumber: 'asc' }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // Verify ownership
        if (classData.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'You can only view your own classes' });
        }

        res.json(classData);
    } catch (error) {
        console.error('Get class error:', error);
        res.status(500).json({ error: 'Failed to fetch class' });
    }
};

export const createClass = async (req: any, res: Response) => {
    try {
        const { name, subject, academicYear } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        const classData = await prisma.class.create({
            data: {
                name,
                subject,
                academicYear,
                teacherId: req.user.id
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(classData);
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
};

export const updateClass = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { name, subject, academicYear } = req.body;

        // Check if class exists and verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id: Number(id) }
        });

        if (!existingClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (existingClass.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own classes' });
        }

        const classData = await prisma.class.update({
            where: { id: Number(id) },
            data: {
                ...(name && { name }),
                ...(subject !== undefined && { subject }),
                ...(academicYear !== undefined && { academicYear })
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        res.json(classData);
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ error: 'Failed to update class' });
    }
};

export const deleteClass = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Check if class exists and verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id: Number(id) }
        });

        if (!existingClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (existingClass.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own classes' });
        }

        await prisma.class.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
};
