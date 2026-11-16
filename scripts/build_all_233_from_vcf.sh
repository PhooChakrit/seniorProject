#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Batch Pipeline: Build FASTA (.fa.gz) & GFF3 (.sorted.gff3.gz) for 233 Varieties
#
# Phase 1: Single-pass split of 233access.snp.clean.vcf.gz and
#          233access.indel.clean.vcf.gz using `bcftools +split` (reads the 10.6 GB
#          VCF only ONCE instead of 233 times!)
# Phase 2: Parallel execution (4 workers) of `scripts/build_cultivar_from_vcf.sh`
#          for all remaining varieties in `scripts/varieties_233.tsv`.
#
# Usage:
#   ./scripts/build_all_233_from_vcf.sh [LIMIT] [PARALLEL_JOBS]
# ==============================================================================

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSV_FILE="$REPO_ROOT/scripts/varieties_233.tsv"
BUILD_ONE="$REPO_ROOT/scripts/build_cultivar_from_vcf.sh"
SNP_VCF="$REPO_ROOT/download_233/233access.snp.clean.vcf.gz"
INDEL_VCF="$REPO_ROOT/download_233/233access.indel.clean.vcf.gz"

LIMIT="${1:-0}"
PARALLEL_JOBS="${2:-4}"

if [[ ! -f "$TSV_FILE" ]]; then
  echo "Error: $TSV_FILE not found"
  exit 1
fi

SPLIT_DIR="$REPO_ROOT/genomes/.vcf_split_tmp"
mkdir -p "$SPLIT_DIR"

# Collect varieties that still need to be built
PENDING_SAMPLES_SNP="$SPLIT_DIR/samples_snp.txt"
PENDING_SAMPLES_INDEL="$SPLIT_DIR/samples_indel.txt"
PENDING_LIST="$SPLIT_DIR/pending_varieties.tsv"
> "$PENDING_SAMPLES_SNP"
> "$PENDING_SAMPLES_INDEL"
> "$PENDING_LIST"

COUNT=0
TOTAL=$(tail -n +2 "$TSV_FILE" | wc -l | tr -d ' ')

while IFS=$'\t' read -r SAMPLE_NO CODE LABEL TH_NAME EN_NAME GS_NO; do
  [[ -z "$SAMPLE_NO" || "$SAMPLE_NO" == "sample_no" ]] && continue
  COUNT=$((COUNT + 1))

  if [[ -f "$REPO_ROOT/genomes/$CODE/${CODE}.sorted.gff3.gz.tbi" && -f "$REPO_ROOT/genomes/$CODE/${CODE}.fa.gz.fai" ]]; then
    echo "[$COUNT/$TOTAL] Skipping $LABEL ($CODE) — already built."
  else
    mkdir -p "$REPO_ROOT/genomes/$CODE"
    echo -e "${SAMPLE_NO}\t-\t${CODE}.snp.split" >> "$PENDING_SAMPLES_SNP"
    echo -e "${SAMPLE_NO}\t-\t${CODE}.indel.split" >> "$PENDING_SAMPLES_INDEL"
    echo -e "${SAMPLE_NO}\t${CODE}\t${LABEL}" >> "$PENDING_LIST"
  fi

  if [[ "$LIMIT" -gt 0 && "$COUNT" -ge "$LIMIT" ]]; then
    break
  fi
done < <(tail -n +2 "$TSV_FILE")

PENDING_COUNT=$(wc -l < "$PENDING_LIST" | tr -d ' ')
if [[ "$PENDING_COUNT" -eq 0 ]]; then
  echo "All requested varieties are already built!"
  rm -rf "$SPLIT_DIR"
  exit 0
fi

echo "=================================================================="
echo " Phase 1: Single-Pass VCF Split via bcftools +split ($PENDING_COUNT varieties)"
echo "=================================================================="

# Check if pre-split files already exist for the first pending variety
FIRST_CODE=$(head -n 1 "$PENDING_LIST" | cut -f 2)
if [[ ! -f "$REPO_ROOT/genomes/$FIRST_CODE/${FIRST_CODE}.snp.split.vcf.gz" ]]; then
  echo " -> Splitting SNP VCF (10.6 GB) and Indel VCF (2.7 GB) in parallel..."
  bcftools +split -S "$PENDING_SAMPLES_SNP" -i 'GT="alt"' -k FMT/GT -Oz -o "$SPLIT_DIR" "$SNP_VCF" &
  PID_SPLIT_SNP=$!

  bcftools +split -S "$PENDING_SAMPLES_INDEL" -i 'GT="alt"' -k FMT/GT -Oz -o "$SPLIT_DIR" "$INDEL_VCF" &
  PID_SPLIT_INDEL=$!

  wait "$PID_SPLIT_SNP"
  wait "$PID_SPLIT_INDEL"

  echo " -> Moving per-cultivar split VCFs into genomes/<CODE>/..."
  while IFS=$'\t' read -r SAMPLE_NO CODE LABEL; do
    if [[ -f "$SPLIT_DIR/${CODE}.snp.split.vcf.gz" ]]; then
      mv "$SPLIT_DIR/${CODE}.snp.split.vcf.gz" "$REPO_ROOT/genomes/$CODE/${CODE}.snp.split.vcf.gz"
    fi
    if [[ -f "$SPLIT_DIR/${CODE}.indel.split.vcf.gz" ]]; then
      mv "$SPLIT_DIR/${CODE}.indel.split.vcf.gz" "$REPO_ROOT/genomes/$CODE/${CODE}.indel.split.vcf.gz"
    fi
  done < "$PENDING_LIST"
fi

echo "=================================================================="
echo " Phase 2: Building FASTA (.fa.gz) & GFF3 (.sorted.gff3.gz) ($PARALLEL_JOBS parallel workers)"
echo "=================================================================="

run_worker() {
  local worker_id=$1
  local num_workers=$2
  local line_idx=0
  while IFS=$'\t' read -r SAMPLE_NO CODE LABEL; do
    line_idx=$((line_idx + 1))
    if (( (line_idx - 1) % num_workers == worker_id )); then
      echo "[Worker $((worker_id+1)) | Item $line_idx/$PENDING_COUNT] Building $LABEL ($CODE)..."
      "$BUILD_ONE" "$SAMPLE_NO" "$CODE" "$LABEL"
    fi
  done < "$PENDING_LIST"
}

for (( w=0; w<PARALLEL_JOBS; w++ )); do
  run_worker "$w" "$PARALLEL_JOBS" &
done

wait
rm -rf "$SPLIT_DIR"

echo "=================================================================="
echo " Completed all $PENDING_COUNT varieties! Seeding database..."
echo "=================================================================="
npx prisma db seed
