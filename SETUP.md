# JBrowse 2 Application - Quick Start Guide

## Installation Steps

Follow these steps to get your application up and running:

### Step 1: Install Dependencies

```powershell
npm install
```

This will install all required packages for both frontend and backend.

### Step 2: Generate Prisma Client

```powershell
npm run prisma:generate
```

This generates the Prisma client based on your schema.

### Step 3: Initialize Database

```powershell
npm run prisma:migrate
```

This creates the SQLite database and applies migrations. When prompted, enter a migration name like "init".

### Step 4: Start Development Servers

```powershell
npm run dev
```

This starts both:
- Frontend at http://localhost:5173
- Backend API at http://localhost:3000

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:5173**

## First Time Use

1. Click "Sign up" on the login page
2. Create an account with:
   - Name (optional)
   - Email
   - Password (minimum 6 characters)
3. You'll be automatically logged in and redirected to the dashboard

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is in use, you can change them:

**Backend port**: Edit `.env` file
```
PORT=3001
```

**Frontend port**: Edit `vite.config.ts`
```typescript
server: {
  port: 5174,
  // ...
}
```

### Database Issues

Reset the database:
```powershell
Remove-Item prisma\dev.db -ErrorAction SilentlyContinue
npm run prisma:migrate
```

### Module Not Found Errors

The TypeScript errors you see are expected until you run `npm install`. They will disappear after installation.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both frontend and backend together |
| `npm run dev:client` | Run only the frontend (Vite) |
| `npm run dev:server` | Run only the backend (Express) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |

## Next Steps

After setup, explore:

1. **Dashboard** (`/dashboard`) - View statistics and quick actions
2. **JBrowse** (`/jbrowse`) - Interactive genome browser with human genome GRCh38
3. **Data** (`/data`) - Browse genome datasets (with pagination when you add data)

## Adding Sample Data

You can use Prisma Studio to add sample genome data:

```powershell
npm run prisma:studio
```

Then add records to the `GenomeData` table.

## Production Deployment

Before deploying:

1. Change `JWT_SECRET` in `.env` to a secure random string
2. Configure production database (PostgreSQL, MySQL, etc.) in `prisma/schema.prisma`
3. Set appropriate CORS origins in `server/index.ts`
4. Build the application: `npm run build`

## Need Help?

- Check the main README.md for detailed documentation
- Review the project structure in README.md
- All TypeScript types are documented in `src/types/index.ts`

---

**Enjoy building with JBrowse 2! 🧬**
