import express from 'express';
import { PrismaClient } from '@prisma/client';
import amqplib from 'amqplib';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import * as path from 'path';
import {
  genomesBaseDir,
  loadContigsFromFai,
  loadGenomeManifestById,
  parseDefaultContig,
} from '../utils/genomeManifest';

const router = express.Router();
const prisma = new PrismaClient();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'crispr_tasks';

/** Messages waiting in the worker queue (best-effort; null if RabbitMQ unreachable). */
async function getCrisprQueueDepth(): Promise<number | null> {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const { messageCount } = await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.close();
    await connection.close();
    return typeof messageCount === 'number' ? messageCount : null;
  } catch (err) {
    console.warn('[analysis/jobs] RabbitMQ queue depth unavailable:', err);
    return null;
  }
}

interface AnalysisVarietyResponse {
  id: string;
  label: string;
  defaultContig: string;
  contigs: string[];
  warnings: string[];
}

// Helper function to generate unique job ID
function generateJobId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// ANALYSIS JOB ENDPOINTS
// ============================================

// Get available varieties for analysis dropdown
router.get('/varieties', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const configs = await prisma.genomeConfig.findMany({
      orderBy: { id: 'asc' },
      select: { key: true, label: true, defaultLocation: true },
    });

    const genomesDir = genomesBaseDir();
    const manifestsById = loadGenomeManifestById(genomesDir);

    const varieties: AnalysisVarietyResponse[] = configs.flatMap((cfg) => {
      const matched = manifestsById.get(cfg.key);
      if (!matched) {
        console.warn(`Skipping analysis variety '${cfg.key}': no matching genome.json id`);
        return [];
      }

      const warnings: string[] = [];
      const fasta = matched.manifest.fasta || '';
      if (!fasta) {
        warnings.push('Missing fasta path in genome.json');
      }

      const fastaPath = path.join(genomesDir, matched.folder, fasta);
      const faiPath = `${fastaPath}.fai`;
      const contigs = loadContigsFromFai(faiPath);
      if (!contigs.length) {
        warnings.push(`Missing or empty FASTA index: ${path.basename(faiPath)}`);
      }

      const defaultContig = parseDefaultContig(cfg.defaultLocation) || contigs[0] || '';
      return [
        {
          id: cfg.key,
          label: matched.manifest.label || cfg.label,
          defaultContig,
          contigs,
          warnings,
        },
      ];
    });

    res.json({ varieties });
  } catch (error) {
    console.error('Error loading analysis varieties:', error);
    res.status(500).json({ error: 'Failed to load analysis varieties' });
  }
});

// Submit a new analysis job
router.post('/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { variety, startPos, endPos, contig, options } = req.body;
    const userId = req.user?.userId;
    const selectedContig = options?.contig || contig || 'ptg000001l';

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!variety) {
      return res.status(400).json({ error: 'Rice variety is required' });
    }

    if (!startPos || !endPos) {
      return res.status(400).json({ error: 'Start and end positions are required' });
    }

    if (endPos <= startPos) {
      return res.status(400).json({ error: 'End position must be greater than start position' });
    }

    const jobId = generateJobId();

    // Create job record in database
    const job = await prisma.searchJob.create({
      data: {
        jobId,
        type: 'region_analysis',
        status: 'pending',
        species: variety, // Using species field to store variety
        chromosome: selectedContig,
        fromPosition: startPos,
        toPosition: endPos,
        userId,
        notifyEmail: options?.email || null,
        // Store options as JSON string in result field temporarily
        result: JSON.stringify({ options, variety, contig: selectedContig, startPos, endPos }),
      },
    });

    // Send to RabbitMQ
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      const message = {
        type: 'region_analysis',
        jobId,
        variety,
        contig: selectedContig,
        startPos,
        endPos,
        options: options || {},
      };

      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      await channel.close();
      await connection.close();
    } catch (mqError) {
      console.error('RabbitMQ error:', mqError);
      // Update job status to failed
      await prisma.searchJob.update({
        where: { jobId },
        data: { status: 'failed', error: 'Failed to queue job' },
      });
      return res.status(500).json({ error: 'Failed to queue analysis job' });
    }

    res.json({
      success: true,
      jobId,
      message: 'Analysis job submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting analysis job:', error);
    res.status(500).json({ error: 'Failed to submit analysis job' });
  }
});

// Submit analysis by gene ID (worker resolves coordinates from GFF3)
router.post('/submit-by-gene', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { variety, geneId, options } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!variety || typeof variety !== 'string') {
      return res.status(400).json({ error: 'Rice variety is required' });
    }

    const trimmedGeneId = typeof geneId === 'string' ? geneId.trim() : '';
    if (!trimmedGeneId) {
      return res.status(400).json({ error: 'Gene ID is required' });
    }

    const jobId = generateJobId();

    await prisma.searchJob.create({
      data: {
        jobId,
        type: 'gene_region_analysis',
        status: 'pending',
        species: variety,
        geneId: trimmedGeneId,
        userId,
        notifyEmail: options?.email || null,
        result: JSON.stringify({ options: options || {}, variety, geneId: trimmedGeneId }),
      },
    });

    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      const message = {
        type: 'gene_region_analysis',
        jobId,
        variety,
        geneId: trimmedGeneId,
        options: options || {},
      };

      channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      await channel.close();
      await connection.close();
    } catch (mqError) {
      console.error('RabbitMQ error:', mqError);
      await prisma.searchJob.update({
        where: { jobId },
        data: { status: 'failed', error: 'Failed to queue job' },
      });
      return res.status(500).json({ error: 'Failed to queue analysis job' });
    }

    res.json({
      success: true,
      jobId,
      message: 'Gene analysis job submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting gene analysis job:', error);
    res.status(500).json({ error: 'Failed to submit gene analysis job' });
  }
});

// Delete a job
router.delete('/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const job = await prisma.searchJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check ownership
    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the job
    await prisma.searchJob.delete({
      where: { jobId },
    });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get job status
router.get('/status/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;

    const job = await prisma.searchJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check ownership
    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      type: job.type,
      species: job.species,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      message: getStatusMessage(job.status),
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Get job results (download)
router.get('/results/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;

    const job = await prisma.searchJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    // Job result contains path to output file or inline data
    const result = job.result ? JSON.parse(job.result) : null;

    if (!result || !result.outputFile) {
      return res.status(404).json({ error: 'Results not available' });
    }

    // Send file or data
    res.json({
      jobId,
      status: 'completed',
      data: result,
    });
  } catch (error) {
    console.error('Error getting job results:', error);
    res.status(500).json({ error: 'Failed to get job results' });
  }
});

// Get parsed results data for modal display (NOTE: using results-data to avoid route conflict with /results/:jobId)
router.get('/results-data/:jobId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;

    const job = await prisma.searchJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job not completed yet' });
    }

    const result = job.result ? JSON.parse(job.result) : null;

    if (!result || !result.outputFile) {
      return res.status(404).json({ error: 'Results not available' });
    }

    // Read and parse TSV file
    const fs = await import('fs');
    const path = await import('path');
    
    // Map container path to host path
    // Container uses: /data/genomes/...
    // Host uses: ./genomes/...
    let outputPath = result.outputFile;
    if (outputPath.startsWith('/data/genomes')) {
      outputPath = outputPath.replace('/data/genomes', path.join(process.cwd(), 'genomes'));
    }
    
    console.log('Looking for output file:', outputPath);
    
    if (!fs.existsSync(outputPath)) {
      console.log('Output file not found at:', outputPath);
      return res.status(404).json({ error: 'Output file not found', path: outputPath });
    }

    const tsvContent = fs.readFileSync(outputPath, 'utf-8');
    const lines = tsvContent.trim().split('\n');
    
    // Skip header, parse data rows
    const spacers = lines.slice(1).map(line => {
      const cols = line.split('\t');
      // Parse seqId to extract start/end (format: ContigName:start-end[:rc])
      const seqId = cols[0] || '';
      let start = '';
      let end = '';
      
      const match = seqId.match(/:(\d+)-(\d+)/);
      if (match) {
        start = match[1];
        end = match[2];
      }

      return {
        seqId,
        start,
        end,
        minMM_GG: cols[1] || '',
        minMM_AG: cols[2] || '',
        seq: cols[3] || '',
        pam: cols[9] || '',
        strand: cols[7] || '',
        location: cols[8] || '',
        spacerClass: cols[10] || '',
      };
    });

    res.json({
      jobId,
      totalResults: spacers.length,
      results: spacers,
    });
  } catch (error) {
    console.error('Error getting results data:', error);
    res.status(500).json({ error: 'Failed to parse results' });
  }
});

// List user's jobs
router.get('/jobs', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    const jobs = await prisma.searchJob.findMany({
      where: {
        userId,
        type: { in: ['custom_analysis', 'region_analysis', 'gene_region_analysis'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const queueWaiting = await getCrisprQueueDepth();

    res.json({ jobs, queueWaiting });
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// Internal endpoint for worker to trigger email notification
// This should only be called by the worker service
router.post('/notify/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, outputFile, error: jobError } = req.body;

    const job = await prisma.searchJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if email notification is requested
    if (!job.notifyEmail) {
      return res.json({ success: true, message: 'No email configured' });
    }

    // Import email service dynamically to avoid circular deps
    const { sendJobCompletionEmail } = await import('../services/email');

    const emailSent = await sendJobCompletionEmail(job.notifyEmail, {
      jobId: job.jobId,
      species: job.species,
      status: status === 'completed' ? 'completed' : 'failed',
      createdAt: job.createdAt,
      completedAt: job.completedAt || new Date(),
      error: jobError || job.error || undefined,
      resultUrl: outputFile ? `${process.env.API_URL || ''}/api/analysis/results/${jobId}` : undefined,
    });

    res.json({
      success: true,
      emailSent,
      email: job.notifyEmail,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Job is waiting in queue...';
    case 'processing':
      return 'Analysis is running. This may take several minutes...';
    case 'completed':
      return 'Analysis completed successfully!';
    case 'failed':
      return 'Analysis failed. Please check error message.';
    default:
      return 'Unknown status';
  }
}

export default router;

