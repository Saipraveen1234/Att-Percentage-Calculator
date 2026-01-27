import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllClasses = async (req: any, res: Response) => {
    try {
        const classes = await prisma.class.findMany({
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

export const getClassById = async (req: Request, res: Response) => {
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

export const updateClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, subject, academicYear } = req.body;

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

export const deleteClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.class.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Failed to delete class' });
    }
};
