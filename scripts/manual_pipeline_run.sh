#!/bin/bash
set -e

# Configuration
GENOME_FILE="/data/genomes/oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa"
GFF_FILE="/data/genomes/oryza/Oryza_DNA.gff3"
OUTPUT_DIR="/data/genomes/oryza/output"
HOST_OUTPUT_DIR="genomes/oryza/output"

echo "=========================================================="
echo "   CRISPR-PLANT v2 Manual Pipeline Run (Full Annotation)  "
echo "=========================================================="

echo "[1/3] Running 'complete_pipeline_run.sh' inside Worker Container..."
echo "      (This may take several minutes for vsearch alignment)"
docker compose run --rm worker bash /app/scripts/complete_pipeline_run.sh "$GENOME_FILE" "oryza_sativa"

echo "[2/3] Running 'annotate_spacers.py' inside Worker Container..."
docker compose run --rm worker python /app/scripts/annotate_spacers.py "$OUTPUT_DIR/spacers_classified.tsv" "$GFF_FILE" > "$HOST_OUTPUT_DIR/spacers_annotated.tsv"

echo "[3/3] Importing to Database (Host)..."
# Using tsx to run typescript directly
# Ensure DATABASE_URL is set (from .env)
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

echo "      Clearing existing spacers for 'oryza_sativa'..."
npx tsx scripts/import_spacers.ts clear oryza_sativa

# Load env in a way that exports to the command?
# Or just assume tsx picks it up (dotenv is usually used in code)
# In import_spacers.ts, we usually use dotenv.

npx tsx scripts/import_spacers.ts "$HOST_OUTPUT_DIR/spacers_annotated.tsv"

echo "=========================================================="
echo "   Pipeline Completed Successfully!   "
echo "=========================================================="
