# Project Scripts

## wait-for-db.js

A cross-platform script that waits for the Docker PostgreSQL container to be healthy before proceeding.

### Usage

```bash
npm run wait-for-db
```

Or as part of the database setup:

```bash
npm run db:setup
```

### How it works

1. Checks if the container `seniorproject-db` is running
2. Monitors the container's health status
3. Waits up to 60 seconds for the database to become healthy
4. Exits with success (0) when healthy, or error (1) on timeout

### Why this exists

The original `sleep 5` command in the `db:setup` script is Unix-specific and doesn't work on Windows. This Node.js script provides a cross-platform solution that:

- Works on Windows, macOS, and Linux
- Actually checks if the database is ready (using Docker health checks)
- Provides visual feedback while waiting
- Has a timeout to prevent hanging forever
