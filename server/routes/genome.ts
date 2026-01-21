import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get genome data with pagination
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.genomeData.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.genomeData.count(),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching genome data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single genome data
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.genomeData.findUnique({
      where: { id: parseInt(id) },
    });

    if (!data) {
      return res.status(404).json({ error: 'Genome data not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching genome data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create genome data
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, assembly, description } = req.body;
    const userId = req.userId!;

    const data = await prisma.genomeData.create({
      data: {
        name,
        assembly,
        description,
        userId,
      },
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating genome data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Run pipeline for a genome
router.post('/run', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Expect body to contain: 
    // - genomeFile: filename mapped in the worker volume
    // - options: optional configuration
    const { genomeFile, options } = req.body;

    if (!genomeFile) {
        return res.status(400).json({ error: 'genomeFile is required' });
    }

    // Import lazily or ensure connected
    const { rabbitMQ } = await import('../lib/rabbitmq');
    
    // Construct job payload
    const jobData = {
        genome_file: genomeFile,
        options: options || {},
        triggeredBy: req.userId,
        timestamp: new Date().toISOString()
    };

    await rabbitMQ.publishJob(jobData);

    res.json({ message: 'Pipeline job submitted successfully', job: jobData });
  } catch (error) {
    console.error('Error submitting pipeline job:', error);
    res.status(500).json({ error: 'Failed to submit job' });
  }
});

export default router;
