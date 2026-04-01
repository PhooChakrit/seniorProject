#!/bin/bash
set -e

# =================================================================
# CRISPR-PLANT v2 Complete Pipeline
# Implements full off-target search and classification logic
# Updated: Dual PAM analysis (NGG + NAG) for minMM_GG and minMM_AG
# =================================================================

INPUT_FILE="$1"
SPECIES="${2:-kdml105}"
START_POS="${3:-}"
END_POS="${4:-}"
PAM="${5:-NGG}"
SPACER_LENGTH="${6:-20}"
MISMATCHES="${7:-3}"
JOB_ID="${8:-spacers_classified}"
CONTIG="${9:-ptg000001l}"
OUTPUT_DIR="output"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPACER_DIR="$SCRIPT_DIR/spacer"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: complete_pipeline_run.sh <input_fasta> [species] [start_pos] [end_pos] [pam] [spacer_length] [mismatches] [job_id] [contig]"
    exit 1
fi

echo "--- Starting Complete Pipeline (Dual PAM Mode) ---"
echo "Input File: $INPUT_FILE"
echo "Species: $SPECIES"
if [ -n "$START_POS" ] && [ "$START_POS" != "0" ]; then
    echo "Region: $START_POS - $END_POS"
fi
echo "Contig: $CONTIG"
echo "Primary PAM: $PAM"
echo "Spacer Length: $SPACER_LENGTH"
echo "Mismatches: $MISMATCHES"

# Setup directories
WORKDIR=$(dirname "$INPUT_FILE")
mkdir -p "$WORKDIR/$OUTPUT_DIR"
cd "$WORKDIR"

# Ensure clean state
rm -f GENOME.fna REGION.fna
rm -f *.fuzznuc *.ids *.10bp *.2MM *.3MM *.userout *.complete
rm -f extract_region.py extract_NGG.py extract_NAG.py build_unique_NGG.py build_unique_NAG.py classify_spacers.py

# 1. Prepare Genome File (extract region if start/end specified)
if [ -n "$START_POS" ] && [ -n "$END_POS" ]; then
    echo "[0/6] Extracting region $START_POS-$END_POS from genome..."
    python3 "$SPACER_DIR/extract_region.py" \
        --input "$INPUT_FILE" \
        --contig "$CONTIG" \
        --start "$START_POS" \
        --end "$END_POS" \
        --output REGION.fna
    ln -sf REGION.fna GENOME.fna
else
    ln -sf "$(basename "$INPUT_FILE")" GENOME.fna
fi

# =================================================================
# FUNCTION: Run off-target analysis for a specific PAM
# =================================================================
run_pam_analysis() {
    local PAM_TYPE=$1
    local PAM_PATTERN=$2
    local PREFIX=$3
    
    echo "[PAM:$PAM_TYPE] Running fuzznuc with pattern: $PAM_PATTERN"
    fuzznuc -sequence GENOME.fna -pattern "$PAM_PATTERN" -outfile ${PREFIX}_spacers.fuzznuc -rformat table -complement -auto || true
    
    python3 "$SPACER_DIR/extract_from_fuzznuc.py" --work-dir . --prefix "$PREFIX"
    
    # Run vsearch
    VSEARCH_ID=$(python3 -c "print(1.0 - float($MISMATCHES) / float($SPACER_LENGTH))")
    VSEARCH_ID_MINUS_1=$(python3 -c "print(1.0 - float($MISMATCHES - 1) / float($SPACER_LENGTH))")
    
    python3 "$SPACER_DIR/build_unique_fasta.py" --work-dir . --prefix "$PREFIX"
    
    echo "[PAM:$PAM_TYPE] Running vsearch alignments..."
    vsearch --usearch_global ${PREFIX}_unique.fa --db ${PREFIX}_unique.fa \
        --id $VSEARCH_ID_MINUS_1 --strand plus --blast6out ${PREFIX}_global.${MISMATCHES}MM_minus1 \
        --minseqlength 10 --maxaccepts 10000 --maxrejects 10000 --threads 4 2>/dev/null || touch ${PREFIX}_global.${MISMATCHES}MM_minus1
        
    vsearch --usearch_global ${PREFIX}_unique.fa --db ${PREFIX}_unique.fa \
        --id $VSEARCH_ID --strand plus --blast6out ${PREFIX}_global.${MISMATCHES}MM \
        --minseqlength 10 --maxaccepts 10000 --maxrejects 10000 --threads 4 2>/dev/null || touch ${PREFIX}_global.${MISMATCHES}MM
    
    # Process off-targets
    python /app/CRISPR-PLANTv2/python-scripts/cp_global_2MM.py ${PREFIX}_global.${MISMATCHES}MM_minus1 ${PREFIX}_local.${MISMATCHES}MM_minus1 2>/dev/null || touch ${PREFIX}_local.${MISMATCHES}MM_minus1
    python /app/CRISPR-PLANTv2/python-scripts/cp_global_3MM.py ${PREFIX}_global.${MISMATCHES}MM ${PREFIX}_local.${MISMATCHES}MM 2>/dev/null || touch ${PREFIX}_local.${MISMATCHES}MM
    
    python /app/CRISPR-PLANTv2/python-scripts/cp_remove_10bp_adjacent_spacers.py ${PREFIX}_local.${MISMATCHES}MM_minus1 ${PREFIX}_local.${MISMATCHES}MM_minus1.10bp 2>/dev/null || touch ${PREFIX}_local.${MISMATCHES}MM_minus1.10bp
    python /app/CRISPR-PLANTv2/python-scripts/cp_remove_10bp_adjacent_spacers.py ${PREFIX}_local.${MISMATCHES}MM ${PREFIX}_local.${MISMATCHES}MM.10bp 2>/dev/null || touch ${PREFIX}_local.${MISMATCHES}MM.10bp
    
    cut -f 1 ${PREFIX}_local.${MISMATCHES}MM_minus1.10bp 2>/dev/null | sort | uniq > ${PREFIX}_off_${MISMATCHES}MM_minus1.ids || touch ${PREFIX}_off_${MISMATCHES}MM_minus1.ids
    cut -f 1 ${PREFIX}_local.${MISMATCHES}MM.10bp 2>/dev/null | sort | uniq > ${PREFIX}_off_${MISMATCHES}MM.ids || touch ${PREFIX}_off_${MISMATCHES}MM.ids
    
    echo "[PAM:$PAM_TYPE] Analysis complete."
}

# =================================================================
# 2. Run analysis for NGG PAM
# =================================================================
echo "[1/6] Running NGG PAM analysis..."
NGG_PATTERN="N(${SPACER_LENGTH})NGG"
run_pam_analysis "NGG" "$NGG_PATTERN" "NGG"

# =================================================================
# 3. Run analysis for NAG PAM  
# =================================================================
echo "[2/6] Running NAG PAM analysis..."
NAG_PATTERN="N(${SPACER_LENGTH})NAG"
run_pam_analysis "NAG" "$NAG_PATTERN" "NAG"

# =================================================================
# 4. Classification with both minMM_GG and minMM_AG
# =================================================================
echo "[5/6] Classification (Dual PAM)..."

RAW_TSV="$OUTPUT_DIR/${JOB_ID}.raw.tsv"
FINAL_TSV="$OUTPUT_DIR/${JOB_ID}.tsv"

python3 "$SPACER_DIR/classify_spacers.py" \
    --work-dir . \
    --mismatches "$MISMATCHES" \
    --pam-label "$PAM" > "$RAW_TSV"

# 5.5 Annotate with real GFF3 (location + gene_id)
echo "[5.5/6] Annotating spacers with GFF3..."

ANNOTATION_FILE=""
if [ -f "$WORKDIR/genome.json" ]; then
    export _GP_WORKDIR="$WORKDIR"
    GFF_REL=$(python3 -c "
import json, os, pathlib
p = pathlib.Path(os.environ['_GP_WORKDIR']) / 'genome.json'
data = json.loads(p.read_text(encoding='utf-8'))
print(data.get('gff3', ''))
" 2>/dev/null || true)
    unset _GP_WORKDIR
    if [ -n "$GFF_REL" ]; then
        ANNOTATION_FILE="$WORKDIR/$GFF_REL"
    fi
fi
if [ ! -f "$ANNOTATION_FILE" ]; then
    case "$SPECIES" in
        kdml105)
            ANNOTATION_FILE="/data/genomes/KDML/KDML105.gff3"
            ;;
    esac
fi

if [ -n "$ANNOTATION_FILE" ] && [ -f "$ANNOTATION_FILE" ]; then
    python3 /app/scripts/annotate_spacers.py "$RAW_TSV" "$ANNOTATION_FILE" -o "$FINAL_TSV" || {
        echo "[WARN] Annotation step failed, falling back to raw TSV"
        cp "$RAW_TSV" "$FINAL_TSV"
    }
else
    echo "[WARN] Annotation file not found for species '$SPECIES', using raw TSV"
    cp "$RAW_TSV" "$FINAL_TSV"
fi

echo "--- Pipeline Finished (Dual PAM Mode) ---"
echo "Output: $WORKDIR/$OUTPUT_DIR/${JOB_ID}.tsv"
