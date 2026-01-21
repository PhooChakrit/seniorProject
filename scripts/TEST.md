# ดู status ของ services
./scripts/docker-test.sh status

# ดูรายการ genome files
./scripts/docker-test.sh list

# เช็ค dependencies
./scripts/docker-test.sh check

# รัน test บนไฟล์เฉพาะ
./scripts/docker-test.sh test oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa

# รัน benchmark ทุกไฟล์
./scripts/docker-test.sh benchmark

# ดู logs
./scripts/docker-test.sh logs

# เข้า shell ใน container
./scripts/docker-test.sh shell