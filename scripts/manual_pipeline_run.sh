#!/bin/bash
set -e

# Default values
GENOME_FILE="genomes/oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa"
SPECIES="oryza_sativa"
OUTPUT_DIR="genomes/oryza"
OUTPUT_FASTA="genomes/oryza/GENOME_NGG_spacers_unique.fa"

echo "============================================="
echo "   CRISPR-PLANT v2 Manual Pipeline Runner"
echo "============================================="
echo "Genome File: $GENOME_FILE"
echo "Species: $SPECIES"
echo "============================================="

# Check if genome file exists
if [ ! -f "$GENOME_FILE" ]; then
    echo "Error: Genome file not found at $GENOME_FILE"
    exit 1
fi

echo "[1/2] Running Computation (Worker Container)..."
# Run the existing worker logic but manually via Docker
# We mount the genomes folder to /app/genomes so the worker can access files
docker-compose run --rm worker /bin/bash -c "
    cd /app/genomes/oryza && \
    /app/worker/run_pipeline.sh Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa
"

echo "[2/2] Importing Results to Database..."
# Check if output exists
if [ ! -f "$OUTPUT_FASTA" ]; then
    echo "Error: Output FASTA not found at $OUTPUT_FASTA"
    echo "Pipeline might have failed."
    exit 1
fi

# Run import script
echo "Importing $OUTPUT_FASTA..."
# Access DB via localhost since we assume this script runs on host
# Ensure DATABASE_URL in .env points to localhost for this to work
# Or execute this inside the 'api' container if network issues arise.
export DATABASE_URL="postgresql://user:password@localhost:5432/seniorproject?schema=public"

npx tsx scripts/import_spacers.ts import "$OUTPUT_FASTA" "$SPECIES"

echo "============================================="
echo "          Manul Run Completed! 🚀"
echo "============================================="
