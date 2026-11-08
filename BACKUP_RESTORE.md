# คู่มือการทำ Backup และ Restore ระบบ ThaiRice Genome

เอกสารนี้อธิบายขั้นตอนการสำรองข้อมูล (Backup) และการกู้คืนข้อมูล (Restore) ของระบบ **ThaiRice Genome (`studenttracker.sc.chula.ac.th/thairice/`)** บนเซิร์ฟเวอร์ 

---

## 1. ข้อมูลที่ถูกสำรอง 

ทุกครั้งที่รันสคริปต์ Backup ระบบจะสร้างโฟลเดอร์ใหม่ตามวัน-เวลา เช่น `/data/backup/thairice-2026-11-08_160000/` ซึ่งภายในประกอบด้วยไฟล์ 3 ส่วนหลัก:

| ชื่อไฟล์                   | รายละเอียดข้อมูลที่เก็บ                                                                                                                                                                                                                                | ต้นทาง                          |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| **`thairice_db.sql.gz`**   | ข้อมูล PostgreSQL (`seniorproject`) ทั้งหมด                                                                                                                                                                                                                   | Docker Container `seniorproject-db` |
| **`thairice_api.tar.gz`**  | โค้ด, ไฟล์`.env`, สคริปต์วิเคราะห์ CRISPR, และ **ไฟล์ Genome ทั้งหมด** (`genomes/KDML/*`, `genomes/oryza/*`, และโฟลเดอร์ `output/`) *(ไม่รวม `node_modules` เพื่อประหยัดพื้นที่)* | `/data/api/thairice`                |
| **`thairice_html.tar.gz`** | ไฟล์ Frontend (Static HTML/JS/CSS)                                                                                                                                                                                                                                      | `/data/html/thairice`               |

---

## 2. วิธีสั่ง Backup 

1. รีโมทเข้าเซิร์ฟเวอร์ผ่าน SSH / PuTTY ด้วยบัญชี `csti`
2. รันคำสั่งต่อไปนี้:

```bash
/data/backup/thairice-backup.sh
```

*(หรือหากต้องการระบุชื่อโฟลเดอร์ปลายทางเอง สามารถระบุต่อท้ายได้ เช่น `/data/backup/thairice-backup.sh /data/backup/my-custom-backup`)*

### ตัวอย่างผลลัพธ์เมื่อ Backup สำเร็จ:

```text
==================================================
 Starting ThaiRice Backup: 2026-11-08_160500
 Target Directory: /data/backup/thairice-2026-11-08_160500
==================================================
[1/3] Backing up PostgreSQL database (seniorproject)...
  -> Saved: /data/backup/thairice-2026-11-08_160500/thairice_db.sql.gz (16K)
[2/3] Backing up /data/api/thairice (code, .env, genomes, outputs)...
  -> Saved: /data/backup/thairice-2026-11-08_160500/thairice_api.tar.gz (980M)
[3/3] Backing up /data/html/thairice (frontend static files)...
  -> Saved: /data/backup/thairice-2026-11-08_160500/thairice_html.tar.gz (15M)
==================================================
 Backup Completed Successfully!
```

---

## 3. วิธีสั่ง Restore (กู้คืนข้อมูลย้อนหลัง)

เมื่อต้องการย้อนข้อมูลกลับไปยังชุด Backup ที่เคยทำไว้:

### ขั้นตอนที่ 1: ดูรายชื่อโฟลเดอร์ Backup ที่มีอยู่

```bash
ls -la /data/backup/
```

*(มองหาโฟลเดอร์ที่ขึ้นต้นด้วย `thairice-YYYY-MM-DD_HHMMSS`)*

### ขั้นตอนที่ 2: รันคำสั่ง Restore โดยระบุโฟลเดอร์ที่ต้องการ

```bash
/data/backup/thairice-restore.sh /data/backup/thairice-YYYY-MM-DD_HHMMSS
```

*(เปลี่ยน `thairice-YYYY-MM-DD_HHMMSS` เป็นชื่อโฟลเดอร์จริงที่ต้องการกู้คืน)*

### ขั้นตอนที่ 3: รีสตาร์ทบริการหลัง Restore (เพื่อให้ระบบโหลดข้อมูลใหม่)

```bash
sudo systemctl restart thairice-api
sudo docker restart seniorproject-worker
```

---

## 4. คำสั่งกรณีต้องการแยก Backup / Restore เฉพาะฐานข้อมูล (Database Only)

หากต้องการสำรองหรือกู้คืน **เฉพาะฐานข้อมูล PostgreSQL** อย่างรวดเร็วโดยไม่รวมไฟล์ Genome ขนาดใหญ่:

- **Backup เฉพาะ Database:**

  ```bash
  sudo docker exec seniorproject-db pg_dump -U postgres -d seniorproject --clean --if-exists | gzip -c > /data/backup/thairice_db_only_$(date +%F).sql.gz
  ```
- **Restore เฉพาะ Database:**

  ```bash
  gunzip -c /data/backup/thairice_db_only_YYYY-MM-DD.sql.gz | sudo docker exec -i seniorproject-db psql -U postgres -d seniorproject
  ```

---

## 5. การจัดการพื้นที่จัดเก็บ

เนื่องจากไฟล์ Genome ใน `thairice_api.tar.gz` มีขนาดประมาณ ~1 GB ต่อการ Backup 1 ครั้ง แนะนำให้ตรวจสอบพื้นที่ว่างของ `/data` เป็นระยะด้วยคำสั่ง:

```bash
df -h /data
```

หากต้องการลบโฟลเดอร์ Backup เก่าที่ไม่ใช้งานแล้ว:

```bash
rm -rf /data/backup/thairice-YYYY-MM-DD_HHMMSS
```
