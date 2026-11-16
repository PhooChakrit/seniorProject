#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Batch Loop: Build FASTA & GFF3 for all 233 Rice Varieties from VCF
# Reads: scripts/varieties_233.tsv
# Calls: scripts/build_cultivar_from_vcf.sh <SAMPLE_NO> <CODE> <LABEL>
#
# Usage:
#   ./scripts/build_all_233_from_vcf.sh [LIMIT]
# Example:
#   ./scripts/build_all_233_from_vcf.sh 5    # build first 5 varieties
#   ./scripts/build_all_233_from_vcf.sh      # build all 233 varieties
# ==============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TSV_FILE="$REPO_ROOT/scripts/varieties_233.tsv"
BUILD_ONE="$REPO_ROOT/scripts/build_cultivar_from_vcf.sh"
LIMIT="${1:-0}"

if [[ ! -f "$TSV_FILE" ]]; then
  echo "Error: $TSV_FILE not found"
  exit 1
fi

COUNT=0
TOTAL=$(tail -n +2 "$TSV_FILE" | wc -l | tr -d ' ')

while IFS=$'\t' read -r SAMPLE_NO CODE LABEL TH_NAME EN_NAME GS_NO; do
  [[ -z "$SAMPLE_NO" || "$SAMPLE_NO" == "sample_no" ]] && continue
  COUNT=$((COUNT + 1))

  if [[ -f "$REPO_ROOT/genomes/$CODE/${CODE}.sorted.gff3.gz.tbi" && -f "$REPO_ROOT/genomes/$CODE/${CODE}.fa.gz.fai" ]]; then
    echo "[$COUNT/$TOTAL] Skipping $LABEL ($CODE) — already built."
  else
    echo "[$COUNT/$TOTAL] Building $LABEL ($CODE, sample=$SAMPLE_NO)..."
    "$BUILD_ONE" "$SAMPLE_NO" "$CODE" "$LABEL"
  fi

  if [[ "$LIMIT" -gt 0 && "$COUNT" -ge "$LIMIT" ]]; then
    echo "Reached limit of $LIMIT varieties. Stopping."
    break
  fi
done < <(tail -n +2 "$TSV_FILE")

echo "All requested varieties built! Run 'npx prisma db seed' to register them in the database."
