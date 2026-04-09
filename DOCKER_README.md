# Docker Setup

เอกสารนี้สรุปการใช้ Docker Compose สำหรับโปรเจกต์นี้

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Compose files

- `docker-compose.yml`: สำหรับ local/dev (เน้น `postgres`, `rabbitmq`, `worker`)
- `docker-compose.prod.yml`: สำหรับ server production (ครบ `postgres`, `rabbitmq`, `api`, `frontend`, `worker`)

## Quick Start (local/dev)

### 1. Start core services

```bash
npm run docker:up
```

This starts services in background.

### 2. Set up database

```bash
npm run wait-for-db
npm run prisma:migrate
npx prisma db seed
```

This creates/upgrades tables and seeds initial data.

### 3. Start application

```bash
npm run dev
```

## Available Docker Commands

- `npm run docker:up` - Start dev compose services
- `npm run docker:down` - Stop dev compose services
- `npm run docker:logs` - View compose logs
- `npm run docker:reset` - Reset compose volume and restart
- `npm run db:setup` - Start docker + wait db + migrate
- `npm run server:init:full` - Bootstrap server-like flow (requires `GENOME_DIR`)

## Worker Service & Bioinformatics Pipeline

This project includes a **bioinformatics worker** (Python 2.7 main process; Python 3 + Biopython for the pipeline) that processes genome files.

- **Code**: `worker/worker.py`, `worker/Dockerfile`; pipeline scripts under **`scripts/`** (`complete_pipeline_run.sh`, `scripts/spacer/*`, `annotate_spacers.py`).
- **Build**: Docker Compose uses **`context: .`** and **`dockerfile: worker/Dockerfile`** so the image can copy both `worker/` and `scripts/spacer/`. Manual build: `docker build -f worker/Dockerfile -t seniorproject-worker:latest .` (from repo root).
- **Documentation**: [worker/README.md](worker/README.md) (pipeline flow, `genome.json` variety discovery).
- **Data**: Mounts local `genomes/` to `/data/genomes`. Each cultivar folder may include **`genome.json`** (`id`, `label`, `fasta`, `gff3`) so the worker can register varieties without editing Python.
- **Dev note**: `docker-compose.yml` also mounts `./scripts` → `/app/scripts`, so pipeline edits on the host apply without rebuilding the worker image.

## Database Configuration

The database is configured with the following default settings:

- **Host**: localhost
- **Port**: 5432
- **Database**: seniorproject
- **User**: postgres
- **Password**: postgres

These settings are defined in:

- `docker-compose.yml` - Docker configuration
- `.env` - Environment variables (DATABASE_URL)

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:push` - Push schema changes without migrations

## Troubleshooting

### Port Already in Use

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Change 5432 to 5433 or another port
```

Then update your `.env` file:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seniorproject?schema=public"
```

### Reset Database

If you need to completely reset the database:

```bash
npm run docker:reset
npm run prisma:migrate
```

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

This will open a web interface at http://localhost:5555 to view and edit your data.

## Production deployment

สำหรับ server ให้ใช้ `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

ไม่ต้องใช้ PM2 เมื่อ deploy ผ่าน Compose ทั้ง stack.
