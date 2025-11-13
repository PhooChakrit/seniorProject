# Docker Database Setup

This project uses Docker to run a PostgreSQL database for development.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Quick Start

### 1. Start the Database

```bash
npm run docker:up
```

This will start a PostgreSQL container in the background.

### 2. Set up the Database Schema

```bash
npm run prisma:migrate
```

This will create the database tables based on your Prisma schema.

### 3. Start the Development Server

```bash
npm run dev
```

## Available Docker Commands

- `npm run docker:up` - Start the PostgreSQL container
- `npm run docker:down` - Stop the PostgreSQL container
- `npm run docker:logs` - View database logs
- `npm run docker:reset` - Reset the database (deletes all data and restarts)
- `npm run db:setup` - Complete setup (start Docker + run migrations)

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
  - "5433:5432"  # Change 5432 to 5433 or another port
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

## Production Deployment

For production, update the database credentials in your `.env` file and use a managed database service instead of Docker.
