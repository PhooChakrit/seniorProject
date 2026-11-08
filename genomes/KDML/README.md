# KDML Genome Files

โฟลเดอร์นี้เป็นที่เก็บ **reference + ผลวิเคราะห์** ของ cultivar เดียวกัน — ใช้ร่วมกับ JBrowse (path ใน `genome.json` / DB) และ worker CRISPR

- **`genome.json`** — ประกาศ `id` (เช่น `kdml105` สำหรับ API/worker), `label`, ชื่อไฟล์ `fasta` / `gff3` ภายในโฟลเดอร์นี้
- **สคริปต์ spacer / fuzznuc** — อยู่ที่ `scripts/spacer/` แบบ global เรียกด้วย `--genome KDML` หรือ `--genome kdml105` (ดู `scripts/spacer/genome_paths.py`)

เอกสารนี้อธิบายว่าไฟล์ในโฟลเดอร์นี้ใช้ทำอะไร และควรใช้ไฟล์ไหนในงานแต่ละแบบ

## ไฟล์หลัก (แนะนำให้ใช้)

- `KDML105.fasta` (~396 MB)  
  ไฟล์ reference genome ของ KDML105 (ตรงกับ `KDML105.asm.default.fa`)

- `KDML105.fasta.fai`  
  index ของ FASTA (สร้างด้วย `samtools faidx`)  
  ใช้สำหรับ random access ตามช่วงตำแหน่ง (region) ให้เร็วขึ้น

- `KDML105.gff3` (~110 MB)  
  ไฟล์ Final Genome Annotation (`KDML105_final_renamed_sorted.gff3`) ที่รวม 3 แหล่ง (RAP-DB liftoff 23,786 ยีน + IR64 liftoff 11,572 ยีน + MAKER 5,589 ยีน = 40,947 ยีน)  
  รหัสยีนใช้รูปแบบ `KDML_contigname_NNNNNN` (เช่น `KDML_ptg000001l_000100`) และเก็บรหัสเดิมไว้ใน `original_ID`

- `KDML105.sorted.gff3.gz` (~12 MB) + `KDML105.sorted.gff3.gz.tbi` (~77 KB)  
  ไฟล์ annotation GFF3 ที่ถูก sort + bgzip และทำ tabix index แล้ว  
  ใช้สำหรับแสดงผล Track บน JBrowse อย่างรวดเร็ว

- `KDML105.gff`  
  ไฟล์ GFF format เดิม (ไม่ใช่ GFF3) — โดยทั่วไปไม่ใช้กับ script ที่ต้องการ GFF3

- `KDML105.sorted.gff3`  
  ไฟล์ GFF3 ที่ sort แล้ว แต่ยังไม่บีบอัด

- `KDML105.cleaned.gff3`, `KDML105.cleaned.gff3.gz`, `KDML105.gff3.gz`  
  ไฟล์ที่เกิดระหว่างการทดลอง/แก้ปัญหา index (เก็บไว้ได้ แต่ไม่ใช่ไฟล์หลัก)

## ใช้ไฟล์ไหนกับงานอะไร

- Worker/Pipeline genome search: ใช้ `KDML105.fasta` (+ `KDML105.fasta.fai` สำหรับงานดึงช่วง)
- Gene annotation import: ใช้ `KDML105.gff3` (หรือ `KDML105.sorted.gff3` ก็ได้)
- Region-based browsing/query (เช่น JBrowse/Tabix): ใช้ `KDML105.sorted.gff3.gz` + `.tbi`

## สร้าง index ใหม่ (ถ้าต้อง regenerate)

```bash
# 1) FASTA index
samtools faidx genomes/KDML/KDML105.fasta

# 2) Sort GFF3
grep -v '^#' genomes/KDML/KDML105.gff3 \
  | awk -F'\t' 'NF>=5{print $1"\t"$4"\t"$0}' \
  | sort -k1,1 -k2,2n \
  | cut -f3- > genomes/KDML/KDML105.sorted.gff3

# 3) bgzip + tabix index
bgzip -c genomes/KDML/KDML105.sorted.gff3 > genomes/KDML/KDML105.sorted.gff3.gz
tabix -p gff genomes/KDML/KDML105.sorted.gff3.gz
```

## หมายเหตุ

- ถ้า `tabix -p gff` error เรื่องตำแหน่งไม่เรียง (unsorted positions) ให้ sort ใหม่ก่อนทุกครั้ง
- สำหรับงาน production/query เร็ว แนะนำใช้ไฟล์คู่ `.sorted.gff3.gz` และ `.tbi` เป็นหลัก
