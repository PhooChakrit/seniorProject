# 🏗️ System Architecture

This document provides a detailed technical architecture overview of the CRISPR-PLANT Genome Browser application.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Details](#component-details)
  - [Frontend Service](#1-frontend-service)
  - [API Service](#2-api-service)
  - [Database Layer](#3-database-layer)
  - [Message Queue](#4-message-queue)
  - [Worker Service](#5-worker-service)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

The CRISPR-PLANT Genome Browser is a **microservices-based architecture** designed for:

1. **Separation of Concerns** - Each service handles a specific domain
2. **Asynchronous Processing** - Long-running bioinformatics tasks don't block the main application
3. **Scalability** - Services can be scaled independently
4. **Containerization** - Easy deployment with Docker Compose

### Architecture Pattern

| Pattern                 | Usage                                  |
| ----------------------- | -------------------------------------- |
| **Monolithic Frontend** | React SPA with all UI components       |
| **RESTful API**         | Express.js backend with Prisma ORM     |
| **Message Queue**       | RabbitMQ for async job processing      |
| **Worker Pattern**      | Python workers consume jobs from queue |

---

## High-Level Architecture

```
                                     ┌──────────────────┐
                                     │     Browser      │
                                     │   (User Agent)   │
                                     └────────┬─────────┘
                                              │
                                              │ HTTPS (Port 5173)
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER COMPOSE NETWORK                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND CONTAINER                              │ │
│  │                                                                         │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │   │                      Vite Dev Server                             │  │ │
│  │   │                                                                  │  │ │
│  │   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │  │ │
│  │   │  │    React     │    │   JBrowse2   │    │    React Query   │  │  │ │
│  │   │  │   Router     │    │   Component  │    │  (Data Fetching) │  │  │ │
│  │   │  └──────────────┘    └──────────────┘    └──────────────────┘  │  │ │
│  │   │                                                                  │  │ │
│  │   │                    Vite Proxy (/api → api:3000)                  │  │ │
│  │   └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                     │                                   │ │
│  └─────────────────────────────────────┼───────────────────────────────────┘ │
│                                        │                                      │
│                                        ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           API CONTAINER                                  │ │
│  │                                                                          │ │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │   │                     Express.js Server                             │  │ │
│  │   │                                                                   │  │ │
│  │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │ │
│  │   │  │   CORS      │  │   Cookie    │  │    JSON Body Parser     │  │  │ │
│  │   │  │ Middleware  │  │   Parser    │  │                         │  │  │ │
│  │   │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │  │ │
│  │   │                                                                   │  │ │
│  │   │  ┌─────────────────────────────────────────────────────────────┐ │  │ │
│  │   │  │                        ROUTES                                │ │  │ │
│  │   │  │  /api/auth/*  │  /api/genome/*  │  /api/health             │ │  │ │
│  │   │  └─────────────────────────────────────────────────────────────┘ │  │ │
│  │   │                              │                                    │  │ │
│  │   │                              ▼                                    │  │ │
│  │   │  ┌─────────────────────────────────────────────────────────────┐ │  │ │
│  │   │  │                    Prisma ORM Client                         │ │  │ │
│  │   │  └─────────────────────────────────────────────────────────────┘ │  │ │
│  │   └──────────────────────────────────────────────────────────────────┘  │ │
│  │                         │                    │                          │ │
│  └─────────────────────────┼────────────────────┼──────────────────────────┘ │
│                            │                    │                            │
│           ┌────────────────┘                    └────────────────┐           │
│           ▼                                                      ▼           │
│  ┌─────────────────────┐                            ┌─────────────────────┐  │
│  │   POSTGRESQL DB     │                            │     RABBITMQ        │  │
│  │                     │                            │                     │  │
│  │  ┌───────────────┐  │                            │  ┌───────────────┐  │  │
│  │  │     User      │  │                            │  │ crispr_tasks  │  │  │
│  │  │    Table      │  │                            │  │    Queue      │  │  │
│  │  └───────────────┘  │                            │  └───────────────┘  │  │
│  │  ┌───────────────┐  │                            │                     │  │
│  │  │  GenomeData   │  │                            │  Management UI:     │  │
│  │  │    Table      │  │                            │  Port 15672         │  │
│  │  └───────────────┘  │                            │                     │  │
│  │                     │                            │                     │  │
│  │  Port: 5432         │                            │  Port: 5672         │  │
│  └─────────────────────┘                            └──────────┬──────────┘  │
│                                                                 │            │
│                                                                 ▼            │
│                                               ┌─────────────────────────────┐│
│                                               │      WORKER CONTAINER       ││
│                                               │                             ││
│                                               │  ┌───────────────────────┐  ││
│                                               │  │   Python 2.7 Worker   │  ││
│                                               │  │                       │  ││
│                                               │  │  ┌─────────────────┐  │  ││
│                                               │  │  │  pika (AMQP)    │  │  ││
│                                               │  │  └─────────────────┘  │  ││
│                                               │  │                       │  ││
│                                               │  │  ┌─────────────────┐  │  ││
│                                               │  │  │ run_pipeline.sh │  │  ││
│                                               │  │  │  • fuzznuc      │  │  ││
│                                               │  │  │  • vsearch      │  │  ││
│                                               │  │  │  • python       │  │  ││
│                                               │  │  └─────────────────┘  │  ││
│                                               │  └───────────────────────┘  ││
│                                               │              │              ││
│                                               └──────────────┼──────────────┘│
│                                                              │               │
│                                                              ▼               │
│                                               ┌─────────────────────────────┐│
│                                               │      GENOME DATA VOLUME     ││
│                                               │     ./genomes:/data/genomes ││
│                                               │                             ││
│                                               │  • FASTA files              ││
│                                               │  • Output files             ││
│                                               │  • Analysis results         ││
│                                               └─────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Service

#### Technology Stack

- **React 18** - Component-based UI library
- **TypeScript** - Static type checking
- **Vite** - Next-generation frontend tooling
- **JBrowse 2** - Genome browser component
- **Material UI (MUI)** - React component library
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client

#### Directory Structure

```
src/
├── api/                    # API client functions
│   ├── auth.ts            # Authentication API calls
│   └── genome.ts          # Genome data API calls
│
├── components/            # React components
│   ├── common/            # Shared components (Loading, ErrorBoundary)
│   ├── crispr/            # CRISPR-specific components
│   │   ├── TargetInput.tsx
│   │   ├── ResultsView.tsx
│   │   └── ...
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/                # UI primitives (Button, Card, Dialog)
│
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state management
│
├── lib/                   # Utilities
│   ├── axios.ts           # Configured Axios instance
│   └── utils.ts           # Helper functions
│
├── pages/                 # Page components
│   ├── DashboardPage.tsx  # User dashboard
│   ├── DataPage.tsx       # Data management
│   ├── JBrowsePage.tsx    # Genome browser
│   └── LoginPage.tsx      # Authentication
│
├── types/                 # TypeScript types
│   └── index.ts           # Shared type definitions
│
├── App.tsx                # Root component & routing
├── main.tsx               # Application entry point
└── index.css              # Global styles
```

#### Key Features

**Authentication Flow**

```typescript
// AuthContext.tsx - Manages authentication state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    localStorage.setItem("token", response.token);
  };

  // ...
};
```

**API Client Configuration**

```typescript
// lib/axios.ts - Axios instance with interceptors
const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Auto-attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 2. API Service

#### Technology Stack

- **Node.js 20** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Static type checking
- **Prisma** - ORM & database toolkit
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing
- **amqplib** - RabbitMQ client

#### Directory Structure

```
server/
├── index.ts               # Server entry point
├── lib/
│   └── rabbitmq.ts        # RabbitMQ connection utility
├── middleware/
│   └── auth.ts            # JWT authentication middleware
└── routes/
    ├── auth.ts            # Authentication endpoints
    └── genome.ts          # Genome data endpoints
```

#### API Endpoints

| Method   | Endpoint             | Auth | Description             |
| -------- | -------------------- | ---- | ----------------------- |
| `POST`   | `/api/auth/register` | No   | Register new user       |
| `POST`   | `/api/auth/login`    | No   | Login user              |
| `POST`   | `/api/auth/logout`   | No   | Logout user             |
| `GET`    | `/api/auth/me`       | Yes  | Get current user        |
| `GET`    | `/api/genome`        | Yes  | List user's genome data |
| `POST`   | `/api/genome`        | Yes  | Create genome record    |
| `GET`    | `/api/genome/:id`    | Yes  | Get genome by ID        |
| `DELETE` | `/api/genome/:id`    | Yes  | Delete genome record    |
| `GET`    | `/api/health`        | No   | Health check            |

#### Request/Response Examples

**Register User**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 3. Database Layer

#### PostgreSQL 16

- **Container**: `seniorproject-db`
- **Port**: `5432`
- **Persistent Volume**: `postgres_data`

#### Schema (Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  password    String       // bcrypt hashed
  name        String?
  genomeData  GenomeData[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model GenomeData {
  id          Int      @id @default(autoincrement())
  name        String
  assembly    String   // e.g., "hg38", "mm10", "IRGSP-1.0"
  description String?
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────┐
│                       User                          │
├─────────────────────────────────────────────────────┤
│ id          : Int          (PK, Auto-increment)     │
│ email       : String       (Unique, Not Null)       │
│ password    : String       (Not Null, Hashed)       │
│ name        : String?      (Nullable)               │
│ createdAt   : DateTime     (Default: now())         │
│ updatedAt   : DateTime     (Auto-update)            │
└─────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────────┐
│                    GenomeData                       │
├─────────────────────────────────────────────────────┤
│ id          : Int          (PK, Auto-increment)     │
│ name        : String       (Not Null)               │
│ assembly    : String       (Not Null)               │
│ description : String?      (Nullable)               │
│ userId      : Int          (FK → User.id)           │
│ createdAt   : DateTime     (Default: now())         │
│ updatedAt   : DateTime     (Auto-update)            │
└─────────────────────────────────────────────────────┘
```

---

### 4. Message Queue

#### RabbitMQ

- **Container**: `seniorproject-rabbitmq`
- **AMQP Port**: `5672`
- **Management UI Port**: `15672`
- **Default Credentials**: `guest/guest`

#### Queue Configuration

| Queue Name     | Durable | Consumers      |
| -------------- | ------- | -------------- |
| `crispr_tasks` | Yes     | Worker service |

#### Message Format

```json
{
  "genome_file": "oryza/IRGSP-1.0.fa",
  "options": {
    "PAM_PATTERN": "N(20)NGG",
    "MIN_SEQ_LENGTH": "20"
  },
  "args": ["-i", "/data/genomes/oryza/IRGSP-1.0.fa"]
}
```

#### Publishing Messages (API Side)

```typescript
// server/lib/rabbitmq.ts
import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = "crispr_tasks";

export async function publishTask(task: object) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
    persistent: true,
  });

  await channel.close();
  await connection.close();
}
```

---

### 5. Worker Service

#### Technology Stack

- **Python 2.7** - Legacy support for bioinformatics scripts
- **pika** - RabbitMQ client
- **EMBOSS (fuzznuc)** - Sequence pattern matching
- **VSEARCH** - Sequence clustering tool
- **CRISPR-PLANTv2** - CRISPR target design scripts

#### Docker Image

```dockerfile
# worker/Dockerfile
FROM python:2.7-slim

# Install bioinformatics tools
RUN apt-get update && apt-get install -y \
    emboss \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install VSEARCH
RUN wget -q https://github.com/torognes/vsearch/releases/download/v2.28.1/vsearch-2.28.1-linux-x86_64.tar.gz \
    && tar xzf vsearch-*.tar.gz \
    && mv vsearch-*/bin/vsearch /usr/local/bin/ \
    && rm -rf vsearch-*

# Install Python dependencies
RUN pip install pika pandas biopython

# Copy application
WORKDIR /app
COPY worker.py .
COPY run_pipeline.sh .

CMD ["python", "worker.py"]
```

#### Pipeline Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Worker Pipeline                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. RECEIVE MESSAGE FROM QUEUE                                      │
│     └─ Parse JSON: { genome_file, options }                         │
│                                                                      │
│  2. VALIDATE INPUT                                                   │
│     └─ Check if genome file exists in /data/genomes/                │
│                                                                      │
│  3. EXECUTE PIPELINE (run_pipeline.sh)                              │
│     │                                                                │
│     ├─ Step 1: fuzznuc                                              │
│     │   ├─ Input:  GENOME.fasta                                     │
│     │   ├─ Pattern: N(20)NGG (Cas9 PAM)                             │
│     │   └─ Output: GENOME_NGG_spacers.fuzznuc                       │
│     │                                                                │
│     ├─ Step 2: cp_fuzznuc_to_fasta.py                               │
│     │   ├─ Input:  GENOME_NGG_spacers.fuzznuc                       │
│     │   ├─ Output: GENOME_NGG_spacers.fa                            │
│     │   └─ Output: GENOME_NGG_spacers.ids                           │
│     │                                                                │
│     └─ Step 3: vsearch --derep_fulllength                           │
│         ├─ Input:  GENOME_NGG_spacers.fa                            │
│         ├─ Min length: 20bp                                          │
│         └─ Output: GENOME_NGG_spacers_unique.fa                      │
│                                                                      │
│  4. ACKNOWLEDGE MESSAGE                                              │
│     └─ Mark task as completed                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Environment Variables

| Variable         | Default                                 | Description             |
| ---------------- | --------------------------------------- | ----------------------- |
| `RABBITMQ_URL`   | `amqp://guest:guest@localhost:5672/%2F` | RabbitMQ connection URL |
| `QUEUE_NAME`     | `crispr_tasks`                          | Queue to consume from   |
| `PAM_PATTERN`    | `N(20)NGG`                              | CRISPR PAM pattern      |
| `MIN_SEQ_LENGTH` | `20`                                    | Minimum spacer length   |

---

## Data Flow

### 1. User Authentication Flow

```
┌──────────┐    POST /api/auth/login     ┌──────────┐
│  Client  │ ──────────────────────────▶ │   API    │
│          │   {email, password}         │          │
└──────────┘                             └────┬─────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │  Find user by   │
                                    │     email       │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Verify password │
                                    │ with bcrypt     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Generate JWT   │
                                    │     token       │
                                    └────────┬────────┘
                                             │
┌──────────┐  {user, token} + cookie  ┌──────┴─────┐
│  Client  │ ◀─────────────────────── │    API     │
│          │                          │            │
└──────────┘                          └────────────┘
```

### 2. CRISPR Job Processing Flow

```
┌──────────┐  Submit CRISPR job   ┌──────────┐
│  Client  │ ───────────────────▶ │   API    │
└──────────┘                      └────┬─────┘
                                       │
                           Publish to queue
                                       │
                                       ▼
                              ┌──────────────┐
                              │   RabbitMQ   │
                              │ crispr_tasks │
                              └──────┬───────┘
                                     │
                           Consume message
                                     │
                                     ▼
                              ┌──────────────┐
                              │    Worker    │
                              │              │
                              │ 1. fuzznuc   │
                              │ 2. convert   │
                              │ 3. vsearch   │
                              └──────┬───────┘
                                     │
                            Write results
                                     │
                                     ▼
                              ┌──────────────┐
                              │   /genomes   │
                              │    volume    │
                              └──────────────┘
```

---

## Security Architecture

### Authentication

| Mechanism              | Implementation                   |
| ---------------------- | -------------------------------- |
| **Password Storage**   | bcrypt with 10 salt rounds       |
| **Session Tokens**     | JWT with 7-day expiration        |
| **Token Storage**      | HTTP-only cookies + localStorage |
| **Token Transmission** | Authorization header (Bearer)    |

### Authorization

| Resource         | Rule                                                   |
| ---------------- | ------------------------------------------------------ |
| User data        | Owner only (userId check)                              |
| Genome data      | Owner only (relation check)                            |
| Public endpoints | `/api/health`, `/api/auth/login`, `/api/auth/register` |

### Network Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Bridge Network                         │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐│
│   │  Frontend   │    │    API      │    │  Internal Services  ││
│   │  :5173 ◄────┼────┼───► :3000   │    │  (postgres, rabbit) ││
│   │  (public)   │    │  (public)   │    │   (internal only)   ││
│   └─────────────┘    └─────────────┘    └─────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Exposed Ports:
- 5173: Frontend (public)
- 3000: API (public)
- 5432: PostgreSQL (development only)
- 15672: RabbitMQ UI (development only)
```

---

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml (development)
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"] # Exposed for debugging

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672" # Management UI

  api:
    image: node:20-alpine
    command: npm run dev:server # Hot reload
    volumes:
      - ./:/app # Live code mounting

  frontend:
    image: node:20-alpine
    command: npm run dev:client # Vite dev server
    volumes:
      - ./:/app
```

### Production Recommendations

```yaml
# docker-compose.prod.yml (production)
services:
  postgres:
    # No exposed ports
    environment:
      POSTGRES_PASSWORD: ${SECURE_PASSWORD}

  rabbitmq:
    # Only expose 5672, not management UI
    ports: ["5672:5672"]

  api:
    build: .
    command: npm run start
    environment:
      NODE_ENV: production

  frontend:
    build: .
    command: npm run preview
    # Or use nginx to serve static files
```

---

## Scalability Considerations

### Current Limitations

1. **Single Worker** - One worker instance processes all jobs sequentially
2. **In-Memory State** - Frontend state not persisted
3. **No Load Balancing** - Single API instance

### Scaling Strategies

#### Horizontal Scaling

```
                         ┌─────────────┐
                         │ Load        │
                    ┌───▶│ Balancer    │◀───┐
                    │    └─────────────┘    │
                    │           │           │
              ┌─────┴───┐ ┌─────┴───┐ ┌─────┴───┐
              │ API #1  │ │ API #2  │ │ API #3  │
              └────┬────┘ └────┬────┘ └────┬────┘
                   │           │           │
                   └───────────┼───────────┘
                               │
                    ┌──────────┴──────────┐
                    │      PostgreSQL     │
                    │   (with replicas)   │
                    └─────────────────────┘
```

#### Worker Scaling

```
                    ┌─────────────────┐
                    │    RabbitMQ     │
                    │  crispr_tasks   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
        │ Worker #1 │  │ Worker #2 │  │ Worker #3 │
        └───────────┘  └───────────┘  └───────────┘
```

### Future Improvements

1. **Redis Cache** - Add caching layer for API responses
2. **WebSocket** - Real-time job status updates
3. **Kubernetes** - Container orchestration for auto-scaling
4. **Object Storage** - S3/MinIO for genome files
5. **Result Database** - Store pipeline results in PostgreSQL

---

## Appendix

### Container Resource Limits

| Service  | Memory | CPU  |
| -------- | ------ | ---- |
| postgres | 512MB  | 0.5  |
| rabbitmq | 256MB  | 0.25 |
| api      | 512MB  | 0.5  |
| frontend | 512MB  | 0.5  |
| worker   | 1GB    | 1.0  |

### Health Check Endpoints

| Service    | URL                                 | Expected Response |
| ---------- | ----------------------------------- | ----------------- |
| API        | `http://localhost:3000/api/health`  | `{"status":"ok"}` |
| RabbitMQ   | `http://localhost:15672/api/health` | HTTP 200          |
| PostgreSQL | `pg_isready -U postgres`            | exit code 0       |

---

_Last updated: January 2026_
