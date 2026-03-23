# 🧬 CRISPR-PLANT Genome Browser

A full-stack bioinformatics web application for CRISPR target design and genome visualization, built with modern technologies and containerized with Docker.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Python](https://img.shields.io/badge/python-2.7-yellow.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Worker Pipeline](#-worker-pipeline)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🔬 Overview

CRISPR-PLANT Genome Browser is a senior project application that provides:

1. **Genome Visualization** - Interactive genome browser powered by JBrowse 2
2. **CRISPR Target Design** - Automated pipeline for finding CRISPR-Cas9 targets
3. **User Management** - Authentication system with JWT tokens
4. **Asynchronous Processing** - Message queue-based job processing for long-running bioinformatics tasks

---

## ✨ Features

### 🧬 Genome Browser

- Interactive genome visualization with JBrowse 2
- Support for multiple assemblies and tracks
- Zoom, pan, and navigate genomic regions
- Track customization and configuration

### 🔍 Genome Search (Fast & Hybrid)

- **Instant Search**: ค้นหา Spacers จากฐานข้อมูล Pre-computed (PostgreSQL) ได้ทันที
- **Search by Region**: ระบุ Species, Chromosome และช่วงตำแหน่ง (Start-End)
- **Search by Gene**: ค้นหาด้วย Gene ID (รองรับ Oryza sativa)
- **Job Result Viewer**: ดูผลลัพธ์ผ่าน Modal, Copy JSON หรือ Download ไฟล์ได้ทันที

### ⚡ Async Pipeline (Legacy & Custom)

- ระบบสำรองสำหรับงานที่ไม่มีใน Database
- ส่งงานเข้า RabbitMQ เพื่อประมวลผลด้วย Python Worker
- PAM detection & Spacer extraction แบบ Real-time

### 👤 User Management

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Session persistence with HTTP-only cookies

### 📊 Data Management

- Upload and manage genome data
- Track analysis history
- Per-user data isolation

---

## 🛠 Tech Stack

### Frontend

| Technology            | Purpose                  |
| --------------------- | ------------------------ |
| **React 18**          | UI Framework             |
| **TypeScript**        | Type Safety              |
| **Vite**              | Build Tool & Dev Server  |
| **JBrowse 2**         | Genome Browser Component |
| **MUI (Material UI)** | UI Component Library     |
| **TailwindCSS**       | Utility-first CSS        |
| **React Query**       | Server State Management  |
| **React Router**      | Client-side Routing      |
| **Axios**             | HTTP Client              |

### Backend

| Technology     | Purpose                |
| -------------- | ---------------------- |
| **Node.js 20** | Runtime Environment    |
| **Express**    | Web Framework          |
| **TypeScript** | Type Safety            |
| **Prisma**     | ORM & Database Toolkit |
| **JWT**        | Authentication Tokens  |
| **bcryptjs**   | Password Hashing       |
| **amqplib**    | RabbitMQ Client        |

### Worker Service

| Technology           | Purpose                       |
| -------------------- | ----------------------------- |
| **Python 2.7**       | Legacy Bioinformatics Scripts |
| **pika**             | RabbitMQ Client               |
| **VSEARCH**          | Sequence Clustering           |
| **EMBOSS (fuzznuc)** | Pattern Matching              |

### Infrastructure

| Technology         | Purpose                 |
| ------------------ | ----------------------- |
| **PostgreSQL 16**  | Relational Database     |
| **RabbitMQ**       | Message Queue           |
| **Docker Compose** | Container Orchestration |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT                                      │
│                         (Browser - localhost:5173)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND SERVICE                                │
│                    React + Vite + JBrowse2 + MUI                            │
│                         Container: seniorproject-frontend                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                              (Vite Proxy /api)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               API SERVICE                                    │
│                   Express + Prisma + JWT Authentication                      │
│                         Container: seniorproject-api                         │
│                              Port: 3000                                      │
│                                                                             │
│  Endpoints:                                                                 │
│  ├── /api/auth/*     - Authentication (login, register, logout)            │
│  ├── /api/genome/*   - Genome data management                              │
│  └── /api/health     - Health check                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
┌────────────────────────────┐         ┌────────────────────────────────────────┐
│      POSTGRESQL DB          │         │              RABBITMQ                  │
│   Container: seniorproject-db│         │   Container: seniorproject-rabbitmq    │
│       Port: 5432            │         │   Ports: 5672 (AMQP), 15672 (UI)       │
│                             │         │                                        │
│  Tables:                    │         │   Queue: crispr_tasks                  │
│  ├── User                   │         │                                        │
│  └── GenomeData             │         │                                        │
└────────────────────────────┘         └────────────────────────────────────────┘
                                                         │
                                                         ▼
                                       ┌────────────────────────────────────────┐
                                       │           WORKER SERVICE                │
                                       │   Python 2.7 + VSEARCH + EMBOSS        │
                                       │   Container: seniorproject-worker       │
                                       │                                        │
                                       │   Pipeline:                            │
                                       │   1. fuzznuc - PAM detection           │
                                       │   2. cp_fuzznuc_to_fasta.py            │
                                       │   3. vsearch - sequence clustering     │
                                       └────────────────────────────────────────┘
                                                         │
                                                         ▼
                                       ┌────────────────────────────────────────┐
                                       │           GENOME DATA VOLUME           │
                                       │            ./genomes:/data/genomes     │
                                       └────────────────────────────────────────┘
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📋 Prerequisites

- **Docker** v20.10+ & **Docker Compose** v2.0+
- **Git** for version control

For local development without Docker:

- **Node.js** v20+
- **npm** v10+
- **Python** 2.7 (for worker scripts)

---

## 🚀 Quick Start

### วิธีที่ 1: Docker (แนะนำ)

ใช้วิธีนี้หากต้องการรันทุก services พร้อมกัน:

```bash
# 1. Clone repository
git clone <repository-url>
cd seniorProject

# 2. สร้าง .env file (ถ้ายังไม่มี)
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=seniorproject
JWT_SECRET=your-secret-key-change-in-production
EOF

# 3. Start ทุก services ด้วย Docker Compose
docker compose up -d

# 4. ดู logs เพื่อเช็คสถานะ (รอประมาณ 1-2 นาทีครั้งแรก)
docker compose logs -f

# 5. เข้าใช้งาน
# 🌐 Frontend: http://localhost:5173
# 🔌 API:      http://localhost:3000/api
# 🐰 RabbitMQ: http://localhost:15672 (guest/guest)
```

#### Docker Commands ที่ใช้บ่อย

```bash
# ดู status ของ containers
docker compose ps

# ดู logs ของ service ใดๆ
docker compose logs -f api      # API logs
docker compose logs -f frontend # Frontend logs
docker compose logs -f worker   # Worker logs

# Restart service
docker compose restart api

# Stop ทั้งหมด
docker compose down

# Stop พร้อมลบ data (database จะถูก reset)
docker compose down -v

# Rebuild และ start ใหม่
docker compose up -d --build
```

---

### วิธีที่ 2: Local Development (ไม่ใช้ Docker สำหรับ app)

ใช้วิธีนี้หากต้องการ develop โดยใช้ hot-reload:

```bash
# 1. ติดตั้ง dependencies
npm install --legacy-peer-deps --force

# 2. สร้าง .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seniorproject
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=seniorproject
JWT_SECRET=your-secret-key-change-in-production
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2F
EOF

# 3. Start PostgreSQL และ RabbitMQ ด้วย Docker
docker compose up -d postgres rabbitmq

# 4. รอให้ database พร้อม แล้ว run migrations
npm run wait-for-db
npx prisma migrate dev

# 5. Start development servers (frontend + backend)
npm run dev

# 📍 Frontend จะรันที่: http://localhost:5173
# 📍 API จะรันที่: http://localhost:3000
```

#### แยก run frontend และ backend

```bash
# Terminal 1: Run backend only
npm run dev:server

# Terminal 2: Run frontend only
npm run dev:client
```

---

### วิธีที่ 3: Production Deployment (Docker ทั้งหมด)

ใช้วิธีนี้สำหรับ deploy บน server (ทุกอย่างอยู่ใน Docker):

#### Step 1: Build Images (บนเครื่อง dev)

```bash
# Build ทุก images
docker compose -f docker-compose.prod.yml build

# หรือ build แยก
docker build -f Dockerfile.api -t seniorproject-api:latest .
docker build -f Dockerfile.frontend -t seniorproject-frontend:latest .
docker build -f worker/Dockerfile -t seniorproject-worker:latest ./worker
```

#### Step 2: Push to Docker Hub (Optional)

```bash
# Tag และ push
docker tag seniorproject-api:latest yourusername/seniorproject-api:latest
docker push yourusername/seniorproject-api:latest

docker tag seniorproject-frontend:latest yourusername/seniorproject-frontend:latest
docker push yourusername/seniorproject-frontend:latest
```

#### Step 3: Deploy บน Server

```bash
# Option A: ถ้า push ไป Docker Hub แล้ว
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Option B: Copy images เป็น tar file
# บนเครื่อง dev:
docker save seniorproject-api seniorproject-frontend seniorproject-worker | gzip > images.tar.gz
scp images.tar.gz user@server:/path/

# บน server:
docker load < images.tar.gz
docker compose -f docker-compose.prod.yml up -d
```

#### Resource Usage (Production)

| Service  | CPU          | RAM         |
| -------- | ------------ | ----------- |
| postgres | 0.3 cores    | 256 MB      |
| rabbitmq | 0.3 cores    | 384 MB      |
| api      | 0.5 cores    | 512 MB      |
| frontend | 0.5 cores    | 512 MB      |
| worker   | 0.4 cores    | 512 MB      |
| **รวม**  | **~2 cores** | **~2.2 GB** |

✅ ใช้งานได้บน server 2 cores / 4GB RAM

#### Production Commands Cheatsheet

| ทำอะไร               | Command                                                   |
| -------------------- | --------------------------------------------------------- |
| Build (ครั้งแรก)     | `docker compose -f docker-compose.prod.yml build`         |
| Start                | `docker compose -f docker-compose.prod.yml up -d`         |
| Stop                 | `docker compose -f docker-compose.prod.yml down`          |
| Restart              | `docker compose -f docker-compose.prod.yml restart`       |
| ดู Logs              | `docker compose -f docker-compose.prod.yml logs -f`       |
| ดู Status            | `docker compose -f docker-compose.prod.yml ps`            |
| Rebuild หลังแก้ code | `docker compose -f docker-compose.prod.yml up -d --build` |

> **หมายเหตุ:** ถ้าแก้ไข code แล้วต้อง rebuild ด้วย `--build` ไม่ใช่แค่ restart เพราะ code อยู่ใน image

---

## 💻 Development

### Available Scripts

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only frontend
npm run dev:client

# Start only backend API server
npm run dev:server

# Build for production
npm run build

# Database commands
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI

# E2E smoke test (queue + API + worker)
chmod +x scripts/e2e_queue_smoke.sh
scripts/e2e_queue_smoke.sh

# Docker commands
npm run docker:up          # Start containers
npm run docker:down        # Stop containers
npm run docker:logs        # View logs
npm run docker:reset       # Reset (delete volumes and restart)
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seniorproject"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=seniorproject

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2F
```

---

## 📁 Project Structure

```
seniorProject/
├── 📂 src/                      # Frontend source code
│   ├── 📂 api/                  # API client functions
│   │   ├── auth.ts              # Authentication API
│   │   └── genome.ts            # Genome data API
│   ├── 📂 components/           # React components
│   │   ├── 📂 common/           # Shared components
│   │   ├── 📂 crispr/           # CRISPR-specific components
│   │   ├── 📂 layout/           # Layout components
│   │   └── 📂 ui/               # UI primitives
│   ├── 📂 contexts/             # React contexts
│   │   └── AuthContext.tsx      # Authentication context
│   ├── 📂 lib/                  # Utility libraries
│   │   ├── axios.ts             # Axios instance
│   │   └── utils.ts             # Utility functions
│   ├── 📂 pages/                # Page components
│   │   ├── DashboardPage.tsx    # User dashboard
│   │   ├── DataPage.tsx         # Data management
│   │   ├── JBrowsePage.tsx      # Genome browser
│   │   └── LoginPage.tsx        # Login/Register
│   ├── 📂 types/                # TypeScript types
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
│
├── 📂 server/                   # Backend source code
│   ├── 📂 lib/                  # Server utilities
│   │   └── rabbitmq.ts          # RabbitMQ client
│   ├── 📂 middleware/           # Express middleware
│   │   └── auth.ts              # JWT auth middleware
│   ├── 📂 routes/               # API routes
│   │   ├── auth.ts              # Auth endpoints
│   │   └── genome.ts            # Genome endpoints
│   └── index.ts                 # Server entry point
│
├── 📂 worker/                   # Python worker service
│   ├── Dockerfile               # Worker container config
│   ├── worker.py                # Message consumer
│   ├── run_pipeline.sh          # CRISPR pipeline script
│   └── README.md                # Worker documentation
│
├── 📂 prisma/                   # Database schema
│   ├── schema.prisma            # Prisma schema
│   └── migrations/              # Database migrations
│
├── 📂 genomes/                  # Genome data files
│   └── (FASTA files)
│
├── 📂 public/                   # Static assets
├── docker-compose.yml           # Container orchestration
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login`    | Login user        |
| `POST` | `/api/auth/logout`   | Logout user       |
| `GET`  | `/api/auth/me`       | Get current user  |

#### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Genome Data

| Method   | Endpoint          | Description              |
| -------- | ----------------- | ------------------------ |
| `GET`    | `/api/genome`     | List user's genome data  |
| `POST`   | `/api/genome`     | Create new genome record |
| `GET`    | `/api/genome/:id` | Get genome by ID         |
| `DELETE` | `/api/genome/:id` | Delete genome record     |

### Genome Search (NEW!)

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| `POST` | `/api/genome/search/region`     | Search by genomic region |
| `POST` | `/api/genome/search/gene`       | Search by gene ID/symbol |
| `GET`  | `/api/genome/search/status/:id` | Get job status           |

#### Search by Region

```bash
curl -X POST http://localhost:3000/api/genome/search/region \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "species": "oryza_sativa",
    "chromosome": "Chr01",
    "fromPosition": 10000,
    "toPosition": 20000
  }'
```

**Response:**

```json
{
  "jobId": "job_1706234567890_abc123",
  "status": "pending",
  "message": "Region search job submitted successfully"
}
```

#### Search by Gene ID

```bash
curl -X POST http://localhost:3000/api/genome/search/gene \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "species": "arabidopsis_thaliana",
    "geneId": "AT1G01010"
  }'
```

### Health Check

```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```

---

## 🗄 Database Schema

```prisma
model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  password    String
  name        String?
  genomeData  GenomeData[]
  searchJobs  SearchJob[]  // Linked jobs
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model SearchJob {
  id           String    @id @default(uuid())
  jobId        String    @unique
  type         String    // 'region_search' or 'gene_search'
  status       String    @default("pending")
  species      String
  chromosome   String?
  fromPosition Int?
  toPosition   Int?
  geneId       String?
  result       String?   // JSON Result
  error        String?
  userId       Int
  user         User      @relation(fields: [userId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Spacer {
  id          Int      @id @default(autoincrement())
  species     String
  chromosome  String
  startPos    Int
  endPos      Int
  strand      String
  spacerSeq   String
  pam         String
  location    String?
  minMM_GG    String?
  spacerClass String?
  createdAt   DateTime @default(now())

  @@index([species, chromosome, startPos])
}

model GenomeData {
  id          Int      @id @default(autoincrement())
  name        String
  assembly    String
  description String?
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## ⚙️ Worker Pipeline

The worker service processes CRISPR target design tasks asynchronously:

### Pipeline Steps

1. **PAM Detection (fuzznuc)**
   - Pattern: `N(20)NGG` (Cas9 PAM)
   - Input: FASTA genome file
   - Output: `.fuzznuc` file with matches

2. **FASTA Conversion**
   - Converts fuzznuc output to FASTA format
   - Generates spacer IDs

3. **Sequence Clustering (VSEARCH)**
   - Dereplicates sequences
   - Filters by minimum length (default: 20bp)
   - Outputs unique CRISPR targets

### Job Message Format

```json
{
  "genome_file": "oryza/genome.fasta",
  "options": {
    "PAM_PATTERN": "N(20)NGG",
    "MIN_SEQ_LENGTH": "20",
    "email": "user@example.com"
  }
}
```

### 📧 Email Notification System

The system can automatically notify users via email when their analysis job completes.

**1. Configuration (.env)**
To enable email notifications, configure the SMTP settings:

```env
# Email Notification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# Leave User/Pass empty to disable
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@crispr-plant.local
FROM_NAME=CRISPR-PLANT v2
```

**2. How it works**

- User includes `email` in the job submission.
- When the worker finishes processing, it triggers the API endpoint `/api/analysis/notify/:jobId`.
- The API server sends an HTML email report with the job status and download link.

---

## ⚡ Performance Note (Why is it slow?)

The **Full Analysis Pipeline** performs extensive specificity checks across the entire genome to prevent off-target effects. This involves:

1.  **Global Alignment (vsearch):** Comparing every spacer candidate against the entire genome database.
    - Complexity: ~ $O(N^2)$
    - Example: 4.5M spacers vs 4.5M targets
2.  **Mismatch Calculation:** Checking for 0, 1, 2, and 3 mismatches for every potential hit.

**Expected Runtime:**

- **Small Genome / Region:** Minutes
- **Whole Genome (Rice/Arabidopsis):** Hours (depends on CPU cores)

> **Recommendation:** For production use, deploy the worker on a high-CPU instance (16+ cores) as `vsearch` scales well with multi-threading.

---

## 🔧 Configuration

### Docker Services

| Service    | Container Name         | Port(s)     |
| ---------- | ---------------------- | ----------- |
| PostgreSQL | seniorproject-db       | 5432        |
| RabbitMQ   | seniorproject-rabbitmq | 5672, 15672 |
| API        | seniorproject-api      | 3000        |
| Frontend   | seniorproject-frontend | 5173        |
| Worker     | seniorproject-worker   | -           |

### Service URLs (Inside Docker Network)

| Service    | Internal URL    |
| ---------- | --------------- |
| PostgreSQL | `postgres:5432` |
| RabbitMQ   | `rabbitmq:5672` |
| API        | `api:3000`      |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Frontend can't connect to API

```bash
# Check if API is running
docker compose logs api

# Check proxy configuration
# Vite should show: "Vite proxy target: http://api:3000"
docker compose logs frontend | grep proxy
```

#### 2. Database connection errors

```bash
# Check PostgreSQL status
docker compose ps postgres

# View database logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```

#### 3. Worker not processing jobs

```bash
# Check RabbitMQ connection
docker compose logs worker

# Access RabbitMQ management UI
# http://localhost:15672 (guest/guest)
```

#### 4. npm install fails in containers

```bash
# Rebuild containers
docker compose up -d --force-recreate

# Or rebuild specific service
docker compose up -d --build worker
```

### Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f api

# Enter container shell
docker compose exec api sh
docker compose exec frontend sh

# Check container status
docker compose ps

# Restart specific service
docker compose restart frontend
```

---

---

## 💾 Data Management Scripts

To populate the database with pre-computed spacers (for instant search), use the included `scripts/import_spacers.ts`.

### 1. **Generate Sample Data** (For Testing)

Generates random spacers for testing without needing real data files.

```bash
# Generate 1000 sample spacers for Oryza sativa
npx ts-node scripts/import_spacers.ts sample 1000 oryza_sativa
```

### 2. **Import from TSV** (Production)

Import real CRISPR-PLANT output files (TSV format).

```bash
# Import spacers from a TSV file
npx ts-node scripts/import_spacers.ts import ./path/to/spacers.tsv oryza_sativa
```

**TSV Format Requirements:**

- Must have headers
- Required columns: `SeqID` (e.g. Chr1:100-120), `Spacer Seq`, `PAM`

### 3. **Manage Data**

```bash
# Check total spacer count
npx ts-node scripts/import_spacers.ts count

# Clear all spacers
npx ts-node scripts/import_spacers.ts clear

# Clear spacers for specific species
npx ts-node scripts/import_spacers.ts clear oryza_sativa
```

---

## 🧬 Gene Data Management

To support **Search by Gene ID**, you need to populate the `Gene` table.

### 1. **Generate Sample Genes** (For Testing)

```bash
# Generate 100 sample genes (IDs like Os01g00100)
npx tsx scripts/import_genes.ts sample 100
```

### 2. **Manage Genes**

```bash
# List sample genes
npx tsx scripts/import_genes.ts list

# Clear all genes
npx tsx scripts/import_genes.ts clear
```

---

## 📄 License

This project is part of a senior project at [University Name].

---

## 👨‍💻 Author

- **Phoo Chakrit** - Senior Project 2026

Os04g00100
Os09g00200
Os09g00300
