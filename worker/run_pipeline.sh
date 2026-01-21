#!/bin/bash
set -e

# Input arguments
INPUT_FILE="$1"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: run_pipeline.sh <input_fasta>"
    exit 1
fi

echo "--- Starting Pipeline ---"
echo "Input: $INPUT_FILE"

# Working directory
WORKDIR=$(dirname "$INPUT_FILE")
cd "$WORKDIR"

# Prepare GENOME.fna symlink (expected by some scripts or just for consistency)
# cp_fuzznuc_to_fasta.py might not strictly need it if we pass args, 
# but pipeline-commands.txt uses generic names.
# We will adapt commands to use the input file provided.

# Defaults
PAM_PATTERN="${PAM_PATTERN:-N(20)NGG}"
MIN_SEQ_LENGTH="${MIN_SEQ_LENGTH:-20}"

# 1. fuzznuc - Find PAMs
echo "[1/3] Running fuzznuc with pattern: $PAM_PATTERN"
fuzznuc -sequence "$INPUT_FILE" -pattern "$PAM_PATTERN" -outfile GENOME_NGG_spacers.fuzznuc

# 2. Convert fuzznuc output to FASTA
echo "[2/3] Converting to FASTA..."
python /app/CRISPR-PLANTv2/python-scripts/cp_fuzznuc_to_fasta.py GENOME_NGG_spacers.fuzznuc GENOME_NGG_spacers.fa GENOME_NGG_spacers.ids

# 3. VSEARCH - Clustering/Deduplication
echo "[3/3] Running vsearch clustering (Min length: $MIN_SEQ_LENGTH)..."
vsearch --derep_fulllength GENOME_NGG_spacers.fa --output GENOME_NGG_spacers_unique.fa --sizeout --minseqlength "$MIN_SEQ_LENGTH"

echo "--- Pipeline Finished ---"
