# register_genome — เตรียมไฟล์พันธุ์ข้าวใหม่

สคริปต์อยู่ที่ **`scripts/register_genome.sh`** (รันจาก root ของ repo) ใช้หลังวางโฟลเดอร์พันธุ์ใต้ `genomes/<ชื่อโฟลเดอร์>/` แล้ว เพื่อสร้าง index ที่ระบบต้องใช้ โดยไม่ต้องจำคำสั่ง `samtools` / `tabix` ทีละบรรทัด

## ก่อนรัน

1. สร้างโฟลเดอร์ เช่น `genomes/MYVARIETY/`
2. ใส่ไฟล์ตาม manifest:
   - **`genome.json`** — ต้องมีฟิลด์ `id`, `label`, `fasta`, `gff3` (path ภายในโฟลเดอร์เดียวกัน)
   - ไฟล์ FASTA และ GFF3 ตามที่อ้างใน manifest
3. ติดตั้งเครื่องมือ:
   - `python3`, `samtools` (บังคับ)
   - ถ้าใช้ `--gff3-index`: `bgzip`, `tabix` (htslib)

ตัวอย่าง `genome.json`:

```json
{
  "id": "myvariety",
  "label": "ชื่อที่แสดงใน UI",
  "fasta": "MYVARIETY.fasta",
  "gff3": "MYVARIETY.gff3"
}
```

**สำคัญ:** ค่า `id` ต้องตรงกับ `GenomeConfig.key` ในฐานข้อมูล (และกับที่ worker ใช้) — ดูรายละเอียดใน [`worker/README.md`](../worker/README.md)

## คำสั่ง

จาก root ของโปรเจกต์:

```bash
# ตรวจว่า manifest + ไฟล์ครบ โดยยังไม่เขียนไฟล์
scripts/register_genome.sh --dir genomes/MYVARIETY --check

# สร้าง FASTA index (.fai) — จำเป็นสำหรับ dropdown contig ในหน้า Analysis
scripts/register_genome.sh --dir genomes/MYVARIETY

# เพิ่ม GFF3 แบบ bgzip + tabix (ใช้เมื่อต้องการ index สำหรับ browse/query เร็ว)
scripts/register_genome.sh --dir genomes/MYVARIETY --gff3-index
```

## สิ่งที่สคริปต์ทำ

| ขั้น | รายละเอียด |
|------|------------|
| ตรวจ manifest | ต้องมี `id`, `label`, `fasta`, `gff3` และไฟล์ FASTA/GFF3 มีอยู่จริง |
| `.fai` | รัน `samtools faidx` บนไฟล์ FASTA → ได้ `<fasta>.fai` |
| (ถ้า `--gff3-index`) | `bgzip -c` GFF3 → `<gff3>.gz` แล้ว `tabix -p gff` → `<gff3>.gz.tbi` |

โหมด `--check` จะตรวจอย่างเดียว ไม่สร้างหรือแก้ไฟล์

## หลังรันสคริปต์

1. **ฐานข้อมูล** — เพิ่มหรืออัปเดตแถว `GenomeConfig` ให้ `key` เท่ากับ `genome.json` ของพันธุ์นี้ (รวม path JBrowse ใน `assemblyConfig` / `tracks` ถ้าใช้)
2. **Worker** — restart service worker เพื่อให้โหลด manifest ใหม่จาก `genomes/*/genome.json`
3. ตรวจว่าไฟล์ static สำหรับเว็บ (เช่น ใต้ `public/genomes/...`) ตรงกับที่ config ใน DB ชี้ ถ้า deploy แยก volume ให้ copy ไฟล์ไปตำแหน่งที่ mount ด้วย

เอกสารเพิ่มเติม: [`JBROWSE_SETUP.md`](../JBROWSE_SETUP.md), [`worker/README.md`](../worker/README.md)
