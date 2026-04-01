# Database Setup

This project uses PostgreSQL (Prisma) for both local and server environments.

## Local DB with Docker

```bash
npm run docker:up
npm run wait-for-db
npm run prisma:migrate
npx prisma db seed
```

Useful commands:
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:reset`
- `npm run prisma:studio`

## Production DB with Compose

บน server ให้ใช้ `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml ps
```

ถ้ารันทั้ง stack ให้ใช้:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Notes

- ห้ามใช้คู่มือเก่าที่อ้าง `prisma/dev.db` (SQLite) เพราะโปรเจกต์นี้ใช้ PostgreSQL แล้ว
- หลังแก้ `prisma/schema.prisma` ให้รัน `npm run prisma:generate`
- Seed ใช้ `npx prisma db seed` (กำหนดไว้ใน `package.json`)
