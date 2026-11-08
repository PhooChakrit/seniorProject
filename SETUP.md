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
- API: `http://localhost:5002` (ตั้งค่าใน `.env`: `PORT=5002`, `API_URL="http://localhost:5002"`)

## Server bootstrap (one-liner)

ถ้าต้องเตรียม genome + db + worker แบบครบ:

```bash
GENOME_DIR=genomes/KDML npm run server:init:full
```

คำสั่งนี้จะรัน: docker up -> wait db -> migrate -> generate -> genome gff3 index -> seed -> restart worker

## Production บน Server จริง (`studenttracker.sc.chula.ac.th`)

### ข้อมูลโครงสร้างบน Server (`161.200.118.52`)
- **SSH User:** `csti@161.200.118.52` (ใช้ไฟล์ `key/senior.pem`)
- **โฟลเดอร์โปรเจกต์หลัก (Git / API / Worker / Genomes):** `/data/api/thairice`
- **โฟลเดอร์ไฟล์ Genome บน Server:** `/data/api/thairice/genomes/<Cultivar>/`
- **โฟลเดอร์ Static Frontend (เว็บที่แสดงผลที่ `/thairice/`):** `/data/html/thairice`
- **Systemd Service สำหรับ API:** `thairice-api` (รันที่พอร์ต `5002`)
- **Docker Containers (`postgres`, `rabbitmq`, `worker`):** รันจาก `/data/api/thairice/docker-compose.yml`

### ขั้นตอน Deploy / อัปเดตโค้ดและ Genome ขึ้น Server

1. **โอนไฟล์ Genome ขนาดใหญ่ (ที่ไม่อยู่ใน Git) จากเครื่อง Local ขึ้น Server ด้วย `rsync`:**
   ```bash
   rsync -avzP -e "ssh -i key/senior.pem" \
     genomes/KDML/KDML105.gff3 \
     genomes/KDML/KDML105.sorted.gff3.gz \
     genomes/KDML/KDML105.sorted.gff3.gz.tbi \
     csti@161.200.118.52:/data/api/thairice/genomes/KDML/
   ```

2. **ดึงโค้ดล่าสุด + Seed DB + Build Frontend บน Server:**
   ```bash
   ssh -i key/senior.pem csti@161.200.118.52 '
     export PATH="/home/csti/.nvm/versions/node/v20.20.0/bin:$PATH"
     cd /data/api/thairice
     git fetch origin && git reset --hard origin/main
     npx prisma db seed
     npm run build
     cp -r dist/* /data/html/thairice/
   '
   ```

3. **Restart API และ Rebuild/Restart Worker บน Server (รันใน SSH/PuTTY เพราะต้องใช้ `sudo`):**
   ```bash
   cd /data/api/thairice
   sudo systemctl restart thairice-api
   sudo docker-compose build worker
   sudo docker rm -f $(sudo docker ps -aq --filter "label=com.docker.compose.service=worker")
   sudo docker-compose up -d --no-deps worker
   ```
   *(หมายเหตุ: บน Server ใช้ `docker-compose 1.29.2` จึงควร `docker rm -f` ตัว container worker เก่าก่อนสั่ง `up -d` เพื่อเลี่ยงบัค `KeyError: 'ContainerConfig'`)*

## หมายเหตุเรื่อง genome index

- ตรวจไฟล์อย่างเดียว:
  - `npm run genome:check -- --dir genomes/<Cultivar>`
- สร้าง `.fai`:
  - `npm run genome:index -- --dir genomes/<Cultivar>`
- สร้าง `.sorted.gff3.gz + .tbi` (สำหรับ JBrowse):
  - `bash scripts/sort_gff3_tabix.sh genomes/<Cultivar>/<File>.gff3 genomes/<Cultivar>/<File>.sorted`

## การทำ Backup และ Restore บน Server (`/data/backup`)

บน Server มีสคริปต์เตรียมไว้ให้ทั้งใน `/data/backup/` และ `/data/api/thairice/scripts/`:

### 1. สั่ง Backup (ทำเมื่อไหร่ก็ได้ที่ต้องการ)
```bash
/data/backup/thairice-backup.sh
```
- สคริปต์จะสร้างโฟลเดอร์ `/data/backup/thairice-YYYY-MM-DD_HHMMSS/` ซึ่งเก็บครบทั้ง 3 ส่วน:
  1. `thairice_db.sql.gz` — ฐานข้อมูล PostgreSQL (`seniorproject`) ทั้งหมด
  2. `thairice_api.tar.gz` — โค้ด, `.env`, และไฟล์ Genome ทั้งหมดใน `/data/api/thairice` (ไม่รวม `node_modules`)
  3. `thairice_html.tar.gz` — ไฟล์หน้าเว็บ Frontend ใน `/data/html/thairice`

### 2. สั่ง Restore (กู้คืนข้อมูลจากโฟลเดอร์ Backup)
```bash
# ดูรายชื่อโฟลเดอร์ Backup ที่มีทั้งหมด
ls -la /data/backup/

# สั่ง Restore จากโฟลเดอร์ที่ต้องการ
/data/backup/thairice-restore.sh /data/backup/thairice-YYYY-MM-DD_HHMMSS
```
