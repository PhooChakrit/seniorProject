import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import genomeRoutes from './routes/genome';
import analysisRoutes from './routes/analysis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const DIST_DIR = path.join(process.cwd(), 'dist');
const STATIC_BASE_PATH = normalizePathPrefix(process.env.VITE_BASE_PATH || '/thairice/');
const PUBLIC_API_BASE_PATH = normalizePathPrefix(process.env.VITE_API_BASE_PATH || '/thairiceapi/api');
const PUBLIC_API_GATEWAY_PATH = deriveGatewayPath(PUBLIC_API_BASE_PATH);
const API_BASE_PATHS = Array.from(new Set(['/api', PUBLIC_API_BASE_PATH]));
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://studenttracker.sc.chula.ac.th')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function normalizePathPrefix(inputPath: string): string {
  const trimmedPath = inputPath.trim();
  const withLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function deriveGatewayPath(apiBasePath: string): string {
  const normalizedApiPath = normalizePathPrefix(apiBasePath);
  if (!normalizedApiPath.endsWith('/api')) {
    return '';
  }

  const gatewayPath = normalizedApiPath.slice(0, -'/api'.length);
  return gatewayPath === '/' ? '' : gatewayPath;
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/genomes', express.static(path.join(process.cwd(), 'genomes')));
if (PUBLIC_API_GATEWAY_PATH) {
  app.use(`${PUBLIC_API_GATEWAY_PATH}/genomes`, express.static(path.join(process.cwd(), 'genomes')));
}
app.use(STATIC_BASE_PATH, express.static(DIST_DIR));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'JBrowse2 App API Server',
    version: '1.0.0',
    endpoints: {
      health: API_BASE_PATHS.map((basePath) => `${basePath}/health`),
      auth: API_BASE_PATHS.map((basePath) => `${basePath}/auth/*`),
      genome: API_BASE_PATHS.map((basePath) => `${basePath}/genome/*`),
    },
    frontend: STATIC_BASE_PATH,
  });
});

for (const apiBasePath of API_BASE_PATHS) {
  app.use(`${apiBasePath}/auth`, authRoutes);
  app.use(`${apiBasePath}/genome`, genomeRoutes);
  app.use(`${apiBasePath}/analysis`, analysisRoutes);

  app.get(`${apiBasePath}/health`, (req, res) => {
    res.json({ status: 'ok' });
  });
}

app.get(`${STATIC_BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
