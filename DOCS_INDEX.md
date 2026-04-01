# 📚 Documentation Index

Welcome to the JBrowse 2 Application! This file helps you navigate all documentation.

## 🎯 Start Here

### New to the Project?
1. **[CHECKLIST.md](./CHECKLIST.md)** ⭐ - Step-by-step setup guide
2. **[SETUP.md](./SETUP.md)** - Quick start instructions
3. **[COMMANDS.md](./COMMANDS.md)** - Common npm commands reference

### Understanding the Project
4. **[README.md](./README.md)** - Complete project documentation
5. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Features and overview
6. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture diagrams

## 📖 Documentation Files

### Getting Started
| File | Purpose | When to Use |
|------|---------|-------------|
| **INSTALL.md** | ตั้งเครื่องใหม่ / ย้าย environment | **เริ่มที่นี่เมื่อตั้งเครื่องใหม่** |
| **CHECKLIST.md** | Interactive setup checklist | First time setup, verification |
| **SETUP.md** | Quick start guide | Initial installation |
| **COMMANDS.md** | npm scripts reference | Daily development |

### Reference Documentation
| File | Purpose | When to Use |
|------|---------|-------------|
| **README.md** | Complete documentation | Understanding features, API |
| **PROJECT_SUMMARY.md** | Project overview | Quick reference, onboarding |
| **ARCHITECTURE.md** | Architecture diagrams | Understanding structure |
| **worker/README.md** | Worker + `genome.json` + pipeline steps | CRISPR queue, new cultivars |
| **scripts/README.md** | Pipeline scripts and `scripts/spacer/` | Manual runs, tooling |
| **DOCKER_README.md** | DB + worker Docker notes | Compose, worker image build |

### Code Organization
| Location | Purpose |
|----------|---------|
| `src/` | Frontend React application |
| `server/` | Backend Express API |
| `prisma/` | Database schema |
| `scripts/` | CRISPR pipeline (`complete_pipeline_run.sh`), `scripts/spacer/` CLIs, `annotate_spacers.py` |
| `genomes/` | Per-cultivar FASTA/GFF3/output; optional `genome.json` per folder for the worker |
| `worker/` | RabbitMQ consumer (`worker.py`), Dockerfile (build from repo root) |

## 🚀 Quick Navigation

### For First-Time Setup
```
1. Read: CHECKLIST.md
2. Follow: SETUP.md
3. Reference: COMMANDS.md
```

### For Development
```
1. Daily: COMMANDS.md
2. API Reference: README.md (API Endpoints section)
3. Architecture: ARCHITECTURE.md
```

### For Understanding Codebase
```
1. Overview: PROJECT_SUMMARY.md
2. Architecture: ARCHITECTURE.md
3. Code: Browse src/ and server/
```

## 📋 Documentation by Topic

### Installation & Setup
- **CHECKLIST.md** - Complete setup checklist
- **SETUP.md** - Installation instructions
- **README.md** - Prerequisites and installation

### Commands & Scripts
- **COMMANDS.md** - All npm commands
- **README.md** - Development scripts section
- **package.json** - Script definitions

### Architecture
- **ARCHITECTURE.md** - Complete architecture diagrams
- **PROJECT_SUMMARY.md** - Architecture highlights
- **README.md** - Project structure section

### Features
- **PROJECT_SUMMARY.md** - All implemented features
- **README.md** - Feature descriptions
- **CHECKLIST.md** - Feature verification

### API Reference
- **README.md** - API endpoints documentation
- **server/routes/** - API implementation
- **src/api/** - API client code

### Database
- **README.md** - Database schema
- **prisma/schema.prisma** - Prisma schema definition
- **COMMANDS.md** - Prisma commands

### Configuration
- **README.md** - Environment variables
- **.env** - Environment configuration
- **vite.config.ts** - Vite configuration
- **tailwind.config.js** - Tailwind configuration

## 🎓 Learning Path

### Beginner Path
1. Read **PROJECT_SUMMARY.md** (10 min)
2. Follow **CHECKLIST.md** (30 min)
3. Browse **README.md** (20 min)
4. Explore code in `src/pages/` (30 min)

### Developer Path
1. Read **ARCHITECTURE.md** (15 min)
2. Study **README.md** (30 min)
3. Review component structure in `src/components/` (30 min)
4. Examine API routes in `server/routes/` (20 min)

### Advanced Path
1. Deep dive into **ARCHITECTURE.md** (30 min)
2. Review all TypeScript types in `src/types/` (15 min)
3. Study Prisma schema and relations (20 min)
4. Understand authentication flow in `server/middleware/` (20 min)

## 🔍 Quick Reference

### Common Questions

**How do I start the app?**
→ See COMMANDS.md or run `npm run dev`

**What's the project structure?**
→ See README.md "Project Structure" or ARCHITECTURE.md

**How does authentication work?**
→ See ARCHITECTURE.md "Security Architecture"

**What are all the features?**
→ See PROJECT_SUMMARY.md "Features Implemented"

**How do I add data to the database?**
→ See CHECKLIST.md "Add Sample Data"

**What npm commands are available?**
→ See COMMANDS.md

**How do I troubleshoot issues?**
→ See CHECKLIST.md "Troubleshooting Checklist"

## 📱 Component Reference

### Pages
- **LoginPage** - `src/pages/LoginPage.tsx`
- **DashboardPage** - `src/pages/DashboardPage.tsx`
- **JBrowsePage** - `src/pages/JBrowsePage.tsx`
- **DataPage** - `src/pages/DataPage.tsx`

### Components
- **Layout** - `src/components/layout/Layout.tsx`
- **Pagination** - `src/components/common/Pagination.tsx`
- **ProtectedRoute** - `src/components/common/ProtectedRoute.tsx`
- **UI Components** - `src/components/ui/`

### Context & Hooks
- **AuthContext** - `src/contexts/AuthContext.tsx`
- **useAuth** - From AuthContext

### API
- **Auth API** - `src/api/auth.ts`
- **Genome API** - `src/api/genome.ts`

## 🛠️ Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `.env` | Environment variables |
| `prisma/schema.prisma` | Database schema |

## 📊 File Structure Overview

```
senior/
├── 📄 Documentation
│   ├── README.md              (Main documentation)
│   ├── PROJECT_SUMMARY.md     (Overview)
│   ├── ARCHITECTURE.md        (Architecture)
│   ├── SETUP.md              (Quick start)
│   ├── CHECKLIST.md          (Setup checklist)
│   ├── COMMANDS.md           (Command reference)
│   └── DOCS_INDEX.md         (This file)
│
├── ⚙️ Configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env
│
├── 🎨 Frontend (src/)
│   ├── pages/                (Route pages)
│   ├── components/           (React components)
│   ├── api/                  (API clients)
│   ├── contexts/             (React contexts)
│   ├── lib/                  (Utilities)
│   └── types/                (TypeScript types)
│
├── 🔧 Backend (server/)
│   ├── routes/               (API routes)
│   ├── middleware/           (Express middleware)
│   └── index.ts             (Server entry)
│
├── 🧬 Data & worker
│   ├── genomes/              (Per-cultivar files + optional genome.json)
│   ├── scripts/              (Pipeline, spacer/, annotate_spacers.py)
│   └── worker/               (worker.py, Dockerfile)
│
└── 🗄️ Database (prisma/)
    └── schema.prisma         (Database schema)
```

## 🎯 Task-Based Navigation

### I want to...

**...set up the project**
→ CHECKLIST.md → SETUP.md

**...understand what was built**
→ PROJECT_SUMMARY.md → README.md

**...learn the architecture**
→ ARCHITECTURE.md

**...find a command**
→ COMMANDS.md

**...understand authentication**
→ ARCHITECTURE.md (Security section) → src/contexts/AuthContext.tsx

**...add a new page**
→ README.md (Component Architecture) → src/pages/

**...add an API endpoint**
→ README.md (API Endpoints) → server/routes/

**...modify the database**
→ prisma/schema.prisma → COMMANDS.md (Prisma commands)

**...add a new rice genome for analysis / JBrowse**
→ Add `genomes/<Folder>/genome.json` + FASTA/GFF3 → [worker/README.md](worker/README.md) → restart worker

**...customize styling**
→ tailwind.config.js → src/index.css

**...troubleshoot an issue**
→ CHECKLIST.md (Troubleshooting) → Browser console

## 🔗 Related Resources

### External Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Prisma Docs](https://www.prisma.io/docs)
- [JBrowse 2 Docs](https://jbrowse.org/jb2/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### In-Code Documentation
- TypeScript interfaces: `src/types/index.ts`
- API schemas: `server/routes/*.ts`
- Component props: Individual component files
- Database models: `prisma/schema.prisma`

## ✅ Documentation Maintenance

This project includes:
- ✅ 6 comprehensive documentation files
- ✅ Inline code comments where needed
- ✅ TypeScript types as documentation
- ✅ Clear folder structure
- ✅ Consistent naming conventions

---

**Start with CHECKLIST.md if you're new to the project!**

**Questions? Check the relevant documentation file above.**

*Last updated: genome.json + scripts/spacer pipeline layout*
