# Setup Quick Start

คู่มือสั้นสำหรับเริ่มระบบให้รันได้เร็วที่สุด (อัปเดตตาม PostgreSQL + Docker Compose ปัจจุบัน)

## Dev local (แนะนำตอนพัฒนา)

```bash
npm install
npm run docker:up
npm run wait-for-db
npm run prisma:migrate
npx prisma db seed
npm run dev
```

เปิดใช้งาน:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

## Server bootstrap (one-liner)

ถ้าต้องเตรียม genome + db + worker แบบครบ:

```bash
GENOME_DIR=genomes/oryza npm run server:init:full
```

คำสั่งนี้จะรัน: docker up -> wait db -> migrate -> generate -> genome gff3 index -> seed -> restart worker

## Production บน server

ใช้ `docker-compose.prod.yml` เป็นหลัก (ไม่ต้องใช้ PM2 เมื่อรันครบ stack ด้วย Compose):

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## หมายเหตุเรื่อง genome index

- ตรวจไฟล์อย่างเดียว:
  - `npm run genome:check -- --dir genomes/<Cultivar>`
- สร้าง `.fai`:
  - `npm run genome:index -- --dir genomes/<Cultivar>`
- สร้าง `.fai + .gff3.gz + .tbi`:
  - `npm run genome:gff3-index -- --dir genomes/<Cultivar>`
