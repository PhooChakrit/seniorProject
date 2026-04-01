# INSTALL — CRISPR-PLANT v2 Web Application

คู่มือนี้ใช้สำหรับ **ตั้งเครื่องใหม่** หรือ **ย้าย environment** ครอบคลุมตั้งแต่ clone repo จนถึง run ได้จริง

---

## ข้อกำหนดเบื้องต้น

| เครื่องมือ | เวอร์ชันขั้นต่ำ | หมายเหตุ |
|-----------|--------------|---------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org/) |
| npm | 10.x | มาพร้อม Node.js |
| Docker Desktop | 27.x | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Docker Compose | v2.x | มาพร้อม Docker Desktop |

---

## ขั้นตอน 1 — Clone และ Install

```bash
git clone <repo-url>
cd new-sn-project
npm install
```

---

## ขั้นตอน 2 — Environment File (`.env`)

สร้างไฟล์ `.env` ที่ root โปรเจกต์ (หรือ copy จากเครื่องเก่า):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seniorproject?schema=public"

# API
PORT=3000
JWT_SECRET=your_secret_key_change_in_production

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/%2F

# Worker
API_URL=http://host.docker.internal:3000
GENOMES_DIR=/data/genomes
```

> **Production**: เปลี่ยน `JWT_SECRET` เป็น random string ที่ยาวและไม่ซ้ำ

---

## ขั้นตอน 3 — ไฟล์ Genome (ต้อง copy จากเครื่องเก่า / external storage)

ไฟล์ genome ขนาดใหญ่ไม่อยู่ใน Git ต้องเตรียมเองก่อน run:

### 3a. KDML105 — สำหรับ worker pipeline (CRISPR analysis)

Worker ต้องการแค่สองไฟล์นี้ — **copy มาวางแล้วใช้ได้เลย**:

```
genomes/
└── KDML/
    ├── genome.json       ← อยู่ใน git แล้ว
    ├── README.md         ← อยู่ใน git แล้ว
    ├── KDML105.fasta     ← copy จากเครื่องเก่า (396 MB)  ✅ จำเป็น
    └── KDML105.gff3      ← copy จากเครื่องเก่า (40 MB)   ✅ จำเป็น
```

> Worker ใช้ BioPython อ่าน FASTA ตรงๆ และอ่าน GFF3 raw — ไม่ต้องสร้าง index ใดๆ

**ถ้าต้องการแสดง KDML บน JBrowse** ด้วย (optional) ต้องสร้าง index เพิ่ม:

```bash
# ต้องติดตั้ง: samtools, bgzip, tabix (htslib)
# macOS: brew install samtools htslib
# Ubuntu: sudo apt-get install samtools tabix

# FASTA index (สำหรับ JBrowse IndexedFasta adapter)
samtools faidx genomes/KDML/KDML105.fasta

# Sort + bgzip + tabix GFF3 (สำหรับ JBrowse Gff3TabixAdapter)
grep -v '^#' genomes/KDML/KDML105.gff3 \
  | awk -F'\t' 'NF>=5{print $1"\t"$4"\t"$0}' \
  | sort -k1,1 -k2,2n \
  | cut -f3- > genomes/KDML/KDML105.sorted.gff3
bgzip -c genomes/KDML/KDML105.sorted.gff3 > genomes/KDML/KDML105.sorted.gff3.gz
tabix -p gff genomes/KDML/KDML105.sorted.gff3.gz
```

แล้วอัปเดต `GenomeConfig` ใน DB (หรือ `prisma/seed.ts`) ให้ชี้ไปที่ไฟล์เหล่านี้

### 3b. Oryza (JBrowse demo) — อยู่ใน git แล้ว

ไฟล์ `public/genomes/oryza/` ถูก track ใน git และจะมาพร้อม clone อัตโนมัติ

### 3c. เพิ่ม cultivar ใหม่

สร้างโฟลเดอร์ใหม่ใต้ `genomes/` พร้อม `genome.json`:

```bash
mkdir -p genomes/MyRice
cat > genomes/MyRice/genome.json << 'EOF'
{
  "id": "myrice01",
  "label": "ชื่อที่แสดงใน UI",
  "fasta": "MyRice.fasta",
  "gff3": "MyRice.gff3"
}
EOF
# วาง FASTA และ GFF3 ลงในโฟลเดอร์ให้ตรงชื่อที่ระบุ
```

> Worker จะ scan `genomes/*/genome.json` ทุกครั้งที่ restart และจะรู้จัก `id` ใหม่โดยอัตโนมัติ

---

## ขั้นตอน 4 — เริ่ม Database และ Services

```bash
# Start PostgreSQL + RabbitMQ (background)
docker compose up -d postgres rabbitmq

# รอจนกว่า postgres healthy (ประมาณ 10-20 วินาที)
npm run wait-for-db

# Run Prisma migrations + seed genome configs
npm run prisma:migrate
npx prisma db seed
```

> `prisma db seed` จะเพิ่ม `GenomeConfig` สำหรับ JBrowse (oryza, human GRCh38) ลงใน DB
> ถ้าต้องการรัน seed ใหม่อีกครั้ง: `npx prisma db seed` (ใช้ upsert ไม่ duplicate)

---

## ขั้นตอน 5 — เริ่ม Development Server

```bash
npm run dev
```

จะเปิดพร้อมกัน:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000

---

## ขั้นตอน 6 — เริ่ม Worker (CRISPR pipeline)

Worker ต้อง build image จาก **root โปรเจกต์** (ไม่ใช่ `worker/` อย่างเดียว เพราะต้องการ `scripts/spacer/`):

```bash
# Build + start worker
docker compose up -d --build worker

# ดู log worker
docker compose logs -f worker

# ตรวจสอบว่า worker เห็น genome ที่เตรียมไว้
# ควรเห็น: [x] Varieties: ['kdml105']
```

---

## ตรวจสอบว่าทุกอย่างพร้อม

```bash
# Status services ทั้งหมด
docker compose ps

# ทดสอบ API
curl http://localhost:3000/api/genome/configs

# ดู genome configs ที่โหลดจาก DB
# ควรเห็น JSON array ของ configs ที่ seed ไว้
```

เปิดเบราว์เซอร์ที่ http://localhost:5173 → สมัครสมาชิก → เข้าหน้า JBrowse ควรโหลด genome ได้

---

## Troubleshooting

### Worker ไม่เห็น variety / genome.json

```bash
# ตรวจสอบว่าไฟล์ genome.json อยู่ในตำแหน่งที่ถูกต้อง
ls genomes/KDML/genome.json

# ตรวจสอบว่า volume mount ทำงาน
docker exec seniorproject-worker ls /data/genomes/
docker exec seniorproject-worker cat /data/genomes/KDML/genome.json

# Restart worker เพื่อโหลด config ใหม่
docker compose restart worker
```

### Database connection failed

```bash
# ตรวจสอบ postgres ทำงาน
docker compose ps postgres

# รีสตาร์ท
docker compose restart postgres
npm run wait-for-db
npm run prisma:migrate
```

### Port ชน

แก้ใน `.env` (API port) หรือใน `vite.config.ts` (frontend port) แล้ว restart

### JBrowse ไม่โหลด genome

```bash
# ตรวจสอบว่า seed รันแล้ว
curl http://localhost:3000/api/genome/configs | python3 -m json.tool | grep label

# รัน seed ซ้ำถ้าจำเป็น
npx prisma db seed
```

---

## สรุปไฟล์ที่ต้องเตรียมเอง (ไม่อยู่ใน Git)

| ไฟล์ / โฟลเดอร์ | ขนาด | จำเป็นสำหรับ | วิธีรับ |
|-----------------|------|-------------|---------|
| `genomes/KDML/KDML105.fasta` | ~396 MB | Worker (pipeline) | copy จากเครื่องเก่า |
| `genomes/KDML/KDML105.gff3` | ~40 MB | Worker (annotation) | copy จากเครื่องเก่า |
| `genomes/KDML/KDML105.sorted.gff3.gz` + `.tbi` | ~3 MB | JBrowse เท่านั้น (optional) | สร้างได้จาก `.gff3` (ขั้นตอน 3a) |
| `.env` | เล็ก | ทั้งหมด | copy จากเครื่องเก่า หรือสร้างใหม่ |
