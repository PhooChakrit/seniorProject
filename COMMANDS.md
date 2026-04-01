# Quick Reference - npm Commands

## 🚀 Most Common Commands

### Start Development (Both Frontend + Backend)
```powershell
npm run dev
```
- Starts Vite dev server on port 5173
- Starts Express server on port 3000
- Both run concurrently with hot reload

### Install All Dependencies
```powershell
npm install
```

### Setup Database (First Time)
```powershell
npm run prisma:generate
npm run prisma:migrate
npx prisma db seed
```

## 📦 All Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend and backend together ⭐ |
| `npm run dev:client` | Run only Vite dev server (port 5173) |
| `npm run dev:server` | Run only Express server (port 3000) |

### Build & Preview

| Command | Description |
|---------|-------------|
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |

### Database (Prisma)

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma Client (after schema changes) |
| `npm run prisma:migrate` | Create and apply database migrations |
| `npm run prisma:studio` | Open Prisma Studio (visual database editor) |
| `npx prisma db seed` | Seed initial data (GenomeConfig, etc.) |

### Genome & Server Init

| Command | Description |
|---------|-------------|
| `npm run genome:check -- --dir genomes/<Cultivar>` | Validate `genome.json` + referenced files (no writes) |
| `npm run genome:index -- --dir genomes/<Cultivar>` | Generate FASTA index `.fai` |
| `npm run genome:gff3-index -- --dir genomes/<Cultivar>` | Generate `.fai` + `.gff3.gz` + `.tbi` |
| `GENOME_DIR=genomes/<Cultivar> npm run server:init` | Bootstrap core stack + migrate + genome index |
| `GENOME_DIR=genomes/<Cultivar> npm run server:init:full` | `server:init` + seed + restart worker |

## 🔄 Typical Workflow

### First Time Setup
```powershell
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Create database and run migrations
npm run prisma:migrate
# Enter migration name: "init"

# 4. Start development
npm run dev
```

### Daily Development
```powershell
# Just start the app
npm run dev
```

### After Changing Database Schema
```powershell
# 1. Update prisma/schema.prisma
# 2. Generate new client
npm run prisma:generate

# 3. Create migration
npm run prisma:migrate
# Enter migration name: "add_new_field"
```

### View/Edit Database Data
```powershell
npm run prisma:studio
# Opens at http://localhost:5555
```

## 🐛 Troubleshooting Commands

### Reset Database (PostgreSQL via Docker)
```powershell
npm run docker:reset
npm run wait-for-db
npm run prisma:migrate
npx prisma db seed
```

### Clean Install
```powershell
# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install
```

### Kill Port (if in use)

**For port 3000:**
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

**For port 5173:**
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## 📊 Production Build

### Build for Production
```powershell
npm run build
```
- Creates optimized build in `dist/` folder
- Minifies and bundles all files
- Ready for deployment

### Test Production Build Locally
```powershell
npm run preview
```
- Serves the production build
- Opens at http://localhost:4173

## 🎯 Quick Actions

### Add a New npm Package
```powershell
# Runtime dependency
npm install package-name

# Dev dependency
npm install -D package-name
```

### Update Dependencies
```powershell
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install package-name@latest
```

## 🔍 Useful Prisma Commands

### View Current Schema
```powershell
cat prisma/schema.prisma
```

### Reset Database (Development)
```powershell
npx prisma migrate reset
# This will:
# - Drop database
# - Create new database
# - Apply all migrations
# - Run seed (if configured)
```

## 🐳 Production Commands (Server)

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml restart worker
```

### Format Schema
```powershell
npx prisma format
```

### Check Migration Status
```powershell
npx prisma migrate status
```

## 💡 Pro Tips

1. **Always run `prisma:generate` after changing `schema.prisma`**
2. **Use `npm run dev` (not separate commands) for best DX**
3. **Use Prisma Studio to quickly add test data**
4. **Check `package.json` for all available scripts**
5. **Errors disappear after `npm install` completes**

## 🎨 Customization Scripts

### Add shadcn/ui Component
```powershell
# (Manual addition - already included in project)
# To add more shadcn components, copy from:
# https://ui.shadcn.com/docs/components
```

### Generate New Prisma Migration
```powershell
npx prisma migrate dev --name your_migration_name
```

---

**Keep this reference handy for quick command lookup! 📌**
