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

### 🎯 CRISPR Target Design

- PAM sequence detection (NGG pattern)
- Spacer extraction and filtering
- VSEARCH-based clustering and deduplication
- Asynchronous job processing

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

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd seniorProject

# 2. Start all services
docker compose up -d

# 3. Wait for services to be ready (about 1-2 minutes first time)
docker compose logs -f

# 4. Access the application
# Frontend: http://localhost:5173
# API:      http://localhost:3000
# RabbitMQ: http://localhost:15672 (guest/guest)
```

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Start PostgreSQL and RabbitMQ (via Docker)
docker compose up -d postgres rabbitmq

# 4. Run database migrations
npx prisma migrate dev

# 5. Start development servers
npm run dev
# This runs both frontend (port 5173) and backend (port 3000)
```

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
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
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
    "MIN_SEQ_LENGTH": "20"
  }
}
```

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

## 📄 License

This project is part of a senior project at [University Name].

---

## 👨‍💻 Author

- **Phoo Chakrit** - Senior Project 2026
