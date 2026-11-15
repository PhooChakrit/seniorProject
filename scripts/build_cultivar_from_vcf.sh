#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Build Cultivar FASTA & GFF3 from 233 Rice Varieties SNP + Indel VCFs
# Uses standard bioinformatics tools: bcftools, CrossMap, samtools, bgzip, tabix
#
# Usage:
#   ./scripts/build_cultivar_from_vcf.sh <SAMPLE_NO> <CODE> [LABEL]
# Example:
#   ./scripts/build_cultivar_from_vcf.sh 100 DV100 "DV100 (ขาวเมล็ดเล็ก)"
# ==============================================================================

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

SAMPLE_NO="${1:-}"
CODE="${2:-}"
LABEL="${3:-${CODE}}"

if [[ -z "$SAMPLE_NO" || -z "$CODE" ]]; then
  echo "Usage: $0 <SAMPLE_NO> <CODE> [LABEL]"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF_FA="$REPO_ROOT/genomes/IRGSP/IRGSP.fa"
REF_GFF="$REPO_ROOT/genomes/IRGSP/IRGSP.gff3"
SNP_VCF="$REPO_ROOT/download_233/233access.snp.clean.vcf.gz"
INDEL_VCF="$REPO_ROOT/download_233/233access.indel.clean.vcf.gz"

OUT_DIR="$REPO_ROOT/genomes/$CODE"
mkdir -p "$OUT_DIR"

ID_LOWER="$(echo "$CODE" | tr '[:upper:]' '[:lower:]')"

echo "=================================================================="
echo " Building Cultivar: $LABEL (Sample=$SAMPLE_NO, Code=$CODE)"
echo "=================================================================="

# 1. Extract sample SNPs and Indels in parallel
echo "[1/5] Extracting SNP & Indel variants for sample $SAMPLE_NO..."
bcftools view --threads 4 -a -s "$SAMPLE_NO" -c 1:nref "$SNP_VCF" \
  | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.snp.vcf.gz" &
PID_SNP=$!

bcftools view --threads 4 -a -s "$SAMPLE_NO" -c 1:nref "$INDEL_VCF" \
  | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.indel.vcf.gz" &
PID_INDEL=$!

wait "$PID_SNP"
wait "$PID_INDEL"

bcftools index -f "$OUT_DIR/${CODE}.snp.vcf.gz"
bcftools index -f "$OUT_DIR/${CODE}.indel.vcf.gz"

# 2. Merge (concat + sort + normalize against IRGSP.fa)
echo "[2/5] Merging and normalizing SNP + Indel VCFs -> ${CODE}.vcf.gz..."
bcftools concat -a "$OUT_DIR/${CODE}.snp.vcf.gz" "$OUT_DIR/${CODE}.indel.vcf.gz" \
  | bcftools sort \
  | bcftools norm -f "$REF_FA" -m -any -d all -Oz -o "$OUT_DIR/${CODE}.vcf.gz"
bcftools index -f "$OUT_DIR/${CODE}.vcf.gz"
rm -f "$OUT_DIR/${CODE}.snp.vcf.gz"* "$OUT_DIR/${CODE}.indel.vcf.gz"*

# 3. Generate Consensus FASTA + Chain file via bcftools consensus
echo "[3/5] Generating ${CODE}.fa and ${CODE}.chain via bcftools consensus..."
bcftools consensus \
  -f "$REF_FA" \
  -c "$OUT_DIR/${CODE}.chain" \
  -s "$SAMPLE_NO" \
  -H A \
  -o "$OUT_DIR/${CODE}.fa" \
  "$OUT_DIR/${CODE}.vcf.gz"

samtools faidx "$OUT_DIR/${CODE}.fa"

# 4. Lift over GFF3 coordinates via CrossMap
echo "[4/5] Lifting over GFF3 via CrossMap -> ${CODE}.gff3..."
CrossMap gff "$OUT_DIR/${CODE}.chain" "$REF_GFF" "$OUT_DIR/${CODE}.raw.gff3"

# Prepend clean GFF3 header and sort + bgzip + tabix for JBrowse 2
echo "##gff-version 3" > "$OUT_DIR/${CODE}.gff3"
awk -F'\t' '{ printf "##sequence-region   %s 1 %s\n", $1, $2 }' "$OUT_DIR/${CODE}.fa.fai" >> "$OUT_DIR/${CODE}.gff3"
grep -v "^#" "$OUT_DIR/${CODE}.raw.gff3" >> "$OUT_DIR/${CODE}.gff3"
rm -f "$OUT_DIR/${CODE}.raw.gff3" "$OUT_DIR/${CODE}.raw.gff3.unmap"

grep "^#" "$OUT_DIR/${CODE}.gff3" > "$OUT_DIR/${CODE}.sorted.gff3"
grep -v "^#" "$OUT_DIR/${CODE}.gff3" | LC_ALL=C sort -t$'\t' -k1,1 -k4,4n >> "$OUT_DIR/${CODE}.sorted.gff3"
bgzip -f "$OUT_DIR/${CODE}.sorted.gff3"
tabix -p gff "$OUT_DIR/${CODE}.sorted.gff3.gz"

# 5. Write genome.json
echo "[5/5] Writing genome.json..."
cat > "$OUT_DIR/genome.json" <<EOF
{
  "id": "${ID_LOWER}",
  "label": "${LABEL}",
  "fasta": "${CODE}.fa",
  "gff3": "${CODE}.gff3"
}
EOF

echo "=================================================================="
echo " Done! Files generated in $OUT_DIR:"
ls -lh "$OUT_DIR/${CODE}.fa" "$OUT_DIR/${CODE}.fa.fai" "$OUT_DIR/${CODE}.gff3" "$OUT_DIR/${CODE}.sorted.gff3.gz" "$OUT_DIR/${CODE}.sorted.gff3.gz.tbi"
echo "=================================================================="
