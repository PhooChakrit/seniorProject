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
// SEARCH JOB ENDPOINTS (MUST BE BEFORE /:id)
// ============================================

// Query pre-computed spacers by region
router.get('/spacers', async (req, res) => {
  try {
    const species = (req.query.species as string) || 'oryza_sativa';
    const chromosome = req.query.chromosome as string;
    const from = parseInt(req.query.from as string) || 0;
    const to = parseInt(req.query.to as string) || 0;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const skip = (page - 1) * limit;

    if (!chromosome) {
      return res.status(400).json({ error: 'chromosome is required' });
    }

    if (from >= to) {
      return res.status(400).json({ error: 'from must be less than to' });
    }

    // Query spacers within the region
    const whereClause = {
      species,
      chromosome: String(chromosome),
      startPos: { gte: from },
      endPos: { lte: to },
    };

    const [spacers, total] = await Promise.all([
      prisma.spacer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { startPos: 'asc' },
      }),
      prisma.spacer.count({ where: whereClause }),
    ]);

    res.json({
      spacers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      query: {
        species,
        chromosome,
        from,
        to,
      },
    });
  } catch (error) {
    console.error('Error fetching spacers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available species and chromosomes
router.get('/spacers/metadata', async (req, res) => {
  try {
    // Get distinct species
    const speciesResult = await prisma.spacer.findMany({
      select: { species: true },
      distinct: ['species'],
    });

    // Get distinct chromosomes per species
    const chromosomesResult = await prisma.spacer.findMany({
      select: { species: true, chromosome: true },
      distinct: ['species', 'chromosome'],
      orderBy: { chromosome: 'asc' },
    });

    // Group chromosomes by species
    const metadata: Record<string, string[]> = {};
    chromosomesResult.forEach((row) => {
      if (!metadata[row.species]) {
        metadata[row.species] = [];
      }
      metadata[row.species].push(row.chromosome);
    });

    res.json({
      species: speciesResult.map((s) => s.species),
      chromosomesBySpecies: metadata,
    });
  } catch (error) {
    console.error('Error fetching spacer metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's job list
router.get('/jobs', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
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

// Search by genomic region
router.post('/search/region', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { species, chromosome, fromPosition, toPosition } = req.body;
    const userId = req.userId!;

    if (!species || !chromosome || fromPosition === undefined || toPosition === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: species, chromosome, fromPosition, toPosition' 
      });
    }

    const from = parseInt(fromPosition);
    const to = parseInt(toPosition);
    
    if (isNaN(from) || isNaN(to)) {
      return res.status(400).json({ error: 'fromPosition and toPosition must be valid numbers' });
    }

    if (from < 0 || to < 0) {
      return res.status(400).json({ error: 'Position values must be non-negative' });
    }

    if (from >= to) {
      return res.status(400).json({ error: 'fromPosition must be less than toPosition' });
    }

    const jobId = generateJobId();

    await prisma.searchJob.create({
      data: {
        jobId,
        type: 'region_search',
        status: 'pending',
        species,
        chromosome,
        fromPosition: from,
        toPosition: to,
        userId,
      }
    });

    const { rabbitMQ } = await import('../lib/rabbitmq');
    
    const jobData = {
      type: 'region_search',
      jobId,
      species,
      chromosome,
      fromPosition: from,
      toPosition: to,
      triggeredBy: userId,
      timestamp: new Date().toISOString()
    };

    await rabbitMQ.publishJob(jobData);

    res.json({ 
      jobId, 
      status: 'pending',
      message: 'Region search job submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting region search job:', error);
    res.status(500).json({ error: 'Failed to submit search job' });
  }
});

// Search by gene ID (Direct Query)
router.post('/search/gene', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { species, geneId } = req.body;

    if (!species || !geneId) {
      return res.status(400).json({ 
        error: 'Missing required fields: species, geneId' 
      });
    }

    const trimmedGeneId = geneId.trim();
    if (trimmedGeneId.length === 0) {
      return res.status(400).json({ error: 'geneId cannot be empty' });
    }

    // 1. Look up Gene in Database
    const gene = await prisma.gene.findFirst({
        where: {
            species,
            geneId: trimmedGeneId // Exact match for now
        }
    });

    if (!gene) {
        return res.status(404).json({ 
            error: `Gene ID '${trimmedGeneId}' not found in database. Please verify the ID or try Region Search.` 
        });
    }

    // 2. Query Spacers in that region
    const spacers = await prisma.spacer.findMany({
        where: {
            species,
            chromosome: gene.chromosome,
            startPos: { gte: gene.startPos },
            endPos: { lte: gene.endPos }
        },
        take: 500 // Limit for safety
    });

    // 3. Return result directly (No Job created)
    res.json({
        gene: {
            id: gene.geneId,
            symbol: gene.symbol,
            chromosome: gene.chromosome,
            start: gene.startPos,
            end: gene.endPos,
            strand: gene.strand,
            description: gene.description
        },
        spacers
    });

  } catch (error) {
    console.error('Error in gene search:', error);
    res.status(500).json({ error: 'Failed to perform gene search' });
  }
});

// Get job status by jobId
router.get('/search/status/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId!;

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
    const { genomeFile, options } = req.body;

    if (!genomeFile) {
        return res.status(400).json({ error: 'genomeFile is required' });
    }

    const { rabbitMQ } = await import('../lib/rabbitmq');
    
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
