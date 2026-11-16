#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Build Cultivar Compressed FASTA (.fa.gz) & GFF3 (.sorted.gff3.gz) from VCFs
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
REF_FA="$REPO_ROOT/genomes/IRGSP/IRGSP.fa.gz"
if [[ ! -f "$REF_FA" ]]; then
  REF_FA="$REPO_ROOT/genomes/IRGSP/IRGSP.fa"
fi
REF_GFF="$REPO_ROOT/genomes/IRGSP/IRGSP.sorted.gff3.gz"
if [[ ! -f "$REF_GFF" ]]; then
  REF_GFF="$REPO_ROOT/genomes/IRGSP/IRGSP.gff3"
fi
SNP_VCF="$REPO_ROOT/download_233/233access.snp.clean.vcf.gz"
INDEL_VCF="$REPO_ROOT/download_233/233access.indel.clean.vcf.gz"

OUT_DIR="$REPO_ROOT/genomes/$CODE"
mkdir -p "$OUT_DIR"

ID_LOWER="$(echo "$CODE" | tr '[:upper:]' '[:lower:]')"

echo "=================================================================="
echo " Building Cultivar (Compressed .gz): $LABEL (Sample=$SAMPLE_NO, Code=$CODE)"
echo "=================================================================="

# 1. Prepare sample SNP and Indel VCFs (use pre-split VCFs from bcftools +split if available)
if [[ -f "$OUT_DIR/${CODE}.snp.split.vcf.gz" && -f "$OUT_DIR/${CODE}.indel.split.vcf.gz" ]]; then
  echo "[1/5] Trimming pre-split SNP & Indel VCFs for $CODE (sample $SAMPLE_NO)..."
  bcftools view -a "$OUT_DIR/${CODE}.snp.split.vcf.gz" \
    | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.snp.vcf.gz"
  bcftools view -a "$OUT_DIR/${CODE}.indel.split.vcf.gz" \
    | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.indel.vcf.gz"
  rm -f "$OUT_DIR/${CODE}.snp.split.vcf.gz"* "$OUT_DIR/${CODE}.indel.split.vcf.gz"*
else
  echo "[1/5] Extracting SNP & Indel variants for sample $SAMPLE_NO..."
  bcftools view --threads 4 -a -s "$SAMPLE_NO" -c 1:nref "$SNP_VCF" \
    | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.snp.vcf.gz" &
  PID_SNP=$!

  bcftools view --threads 4 -a -s "$SAMPLE_NO" -c 1:nref "$INDEL_VCF" \
    | bcftools view -e 'ALT="*"' -Oz -o "$OUT_DIR/${CODE}.indel.vcf.gz" &
  PID_INDEL=$!

  wait "$PID_SNP"
  wait "$PID_INDEL"
fi

bcftools index -f "$OUT_DIR/${CODE}.snp.vcf.gz"
bcftools index -f "$OUT_DIR/${CODE}.indel.vcf.gz"

# 2. Merge (concat + sort + normalize against IRGSP reference)
echo "[2/5] Merging and normalizing SNP + Indel VCFs -> ${CODE}.vcf.gz..."
bcftools concat -a "$OUT_DIR/${CODE}.snp.vcf.gz" "$OUT_DIR/${CODE}.indel.vcf.gz" \
  | bcftools sort -T "$OUT_DIR/sort_tmp" \
  | bcftools norm -f "$REF_FA" -m -any -d all -Oz -o "$OUT_DIR/${CODE}.vcf.gz"
bcftools index -f "$OUT_DIR/${CODE}.vcf.gz"
rm -f "$OUT_DIR/${CODE}.snp.vcf.gz"* "$OUT_DIR/${CODE}.indel.vcf.gz"*

# 3. Generate Consensus FASTA + Chain file via bcftools consensus, then bgzip + samtools faidx
echo "[3/5] Generating ${CODE}.fa.gz and ${CODE}.chain via bcftools consensus + bgzip..."
bcftools consensus \
  -f "$REF_FA" \
  -c "$OUT_DIR/${CODE}.chain" \
  -s "$SAMPLE_NO" \
  -H A \
  "$OUT_DIR/${CODE}.vcf.gz" 2>/dev/null \
  | bgzip -@ 2 -c > "$OUT_DIR/${CODE}.fa.gz"

samtools faidx "$OUT_DIR/${CODE}.fa.gz"

# 4. Lift over GFF3 coordinates via CrossMap -> .sorted.gff3.gz + .tbi
echo "[4/5] Lifting over GFF3 via CrossMap -> ${CODE}.sorted.gff3.gz..."
CrossMap gff "$OUT_DIR/${CODE}.chain" "$REF_GFF" "$OUT_DIR/${CODE}.raw.gff3" >/dev/null 2>&1

{
  echo "##gff-version 3"
  awk -F'\t' '{ printf "##sequence-region   %s 1 %s\n", $1, $2 }' "$OUT_DIR/${CODE}.fa.gz.fai"
  grep -v "^#" "$OUT_DIR/${CODE}.raw.gff3" | LC_ALL=C sort -t$'\t' -k1,1 -k4,4n
} | bgzip -@ 2 -c > "$OUT_DIR/${CODE}.sorted.gff3.gz"

tabix -p gff "$OUT_DIR/${CODE}.sorted.gff3.gz"

# Clean up temporary intermediate files to save disk space
rm -f "$OUT_DIR/${CODE}.raw.gff3"* "$OUT_DIR/${CODE}.vcf.gz"* "$OUT_DIR/${CODE}.chain"

# 5. Write genome.json pointing directly to .fa.gz and .sorted.gff3.gz
echo "[5/5] Writing genome.json for $CODE..."
cat > "$OUT_DIR/genome.json" <<EOF
{
  "id": "${ID_LOWER}",
  "label": "${LABEL}",
  "fasta": "${CODE}.fa.gz",
  "gff3": "${CODE}.sorted.gff3.gz"
}
EOF

echo " [OK] Completed $LABEL ($CODE)"
