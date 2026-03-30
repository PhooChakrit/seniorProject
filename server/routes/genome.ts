import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate unique job ID
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// GENOME CONFIG ENDPOINTS (public)
// ============================================

// GET /api/genome/configs — no auth, returns all genome configs for JBrowse
router.get('/configs', async (req, res) => {
  try {
    const configs = await prisma.genomeConfig.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(configs);
  } catch (error) {
    console.error('Error fetching genome configs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// JOB MANAGEMENT ENDPOINTS
// ============================================

// Get user's job list
router.get('/jobs', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.searchJob.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          type: true,
          status: true,
          species: true,
          chromosome: true,
          fromPosition: true,
          toPosition: true,
          geneId: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          error: true,
        }
      }),
      prisma.searchJob.count({ where: { userId } }),
    ]);

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status (called by worker) - NO AUTH for internal use
router.post('/jobs/update', async (req, res) => {
  try {
    const { jobId, status, result, error } = req.body;

    if (!jobId || !status) {
      return res.status(400).json({ error: 'jobId and status are required' });
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'processing') {
      updateData.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    if (result) {
      updateData.result = JSON.stringify(result);
    }

    if (error) {
      updateData.error = error;
    }

    const job = await prisma.searchJob.update({
      where: { jobId },
      data: updateData,
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// Get job status by jobId
router.get('/search/status/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId!;

    const job = await prisma.searchJob.findFirst({
      where: { 
        jobId,
        userId
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      species: job.species,
      chromosome: job.chromosome,
      fromPosition: job.fromPosition,
      toPosition: job.toPosition,
      geneId: job.geneId,
      result: job.result ? JSON.parse(job.result) : null,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// ============================================
// GENOME DATA ENDPOINTS
// ============================================

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

// Create genome data
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, assembly, description } = req.body;
    const userId = req.user?.userId!;

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

// Get single genome data (MUST BE LAST because of /:id pattern)
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

export default router;
