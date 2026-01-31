# Scripts Directory

Documentation for all utility scripts in the CRISPR-PLANT v2 project.

---

## Pipeline Scripts

### `manual_pipeline_run.sh`

**Entry point** for running the full CRISPR spacer analysis pipeline manually.

```bash
./scripts/manual_pipeline_run.sh
```

- Starts Docker containers
- Executes `complete_pipeline_run.sh` inside worker container
- Imports results to database

---

### `complete_pipeline_run.sh`

**Full bioinformatics pipeline** for CRISPR spacer analysis (runs inside Docker).

```bash
./complete_pipeline_run.sh <genome.fa> [species]
```

**Steps:**

1. **PAM Site Detection** - fuzznuc finds N(20)NGG patterns
2. **Sequence Extraction** - Biopython extracts 23bp spacer sequences
3. **Global Alignment** - vsearch finds off-targets (100% identity)
4. **Local Alignment** - vsearch with 2-3 mismatches tolerance
5. **Classification** - Assigns A0/B0/B1/B2 classes based on off-target matches
6. **Output** - Produces `spacers_classified.tsv`

**Output:** `output/spacers_classified.tsv`

---

### `annotate_spacers.py`

**GFF3-based annotation** - Maps spacers to genomic features.

```bash
python3 scripts/annotate_spacers.py <spacer.tsv> <annotation.gff3> -o <output.tsv>
```

**Output columns added:**

- `location` (Exon, Intron, Intergenic)
- `gene_id` (e.g., Os01g01010)

---

## Data Import Scripts

### `import_spacers.ts`

Import spacer data to PostgreSQL database.

```bash
# Import from TSV (with annotations)
npx tsx scripts/import_spacers.ts import data/spacers.tsv oryza_sativa

# Import from FASTA (basic import)
npx tsx scripts/import_spacers.ts import data/spacers.fa oryza_sativa

# Generate sample data
npx tsx scripts/import_spacers.ts sample 1000 oryza_sativa

# Clear species data
npx tsx scripts/import_spacers.ts clear oryza_sativa

# Count records
npx tsx scripts/import_spacers.ts count
```

---

### `import_genes.ts`

Import gene annotations from GFF3 to database.

```bash
npx tsx scripts/import_genes.ts <annotation.gff3> [species]
```

---

## Utility Scripts

### `wait-for-db.js`

Cross-platform script that waits for PostgreSQL container to be healthy.

```bash
npm run wait-for-db
```

---

### `verify_api.ts`

Test API endpoints for verification.

```bash
npx tsx scripts/verify_api.ts
```

---

## Complete Workflow

To generate fully annotated spacer data:

```bash
# 1. Run full pipeline (inside Docker, ~30-60 min)
./scripts/manual_pipeline_run.sh

# 2. Annotate with GFF3 (local)
python3 scripts/annotate_spacers.py \
  data/genomes/oryza/output/spacers_classified.tsv \
  data/genomes/oryza/Oryza_sativa.IRGSP-1.0.gff3 \
  -o data/genomes/oryza/output/spacers_final.tsv

# 3. Clear old data and re-import
npx tsx scripts/import_spacers.ts clear oryza_sativa
npx tsx scripts/import_spacers.ts import \
  data/genomes/oryza/output/spacers_final.tsv oryza_sativa
```

---

## Expected TSV Format

After running the complete workflow, the output TSV contains:

| Column    | Description            | Example          |
| --------- | ---------------------- | ---------------- |
| SeqID     | Chromosome:Start-End   | Chr1:10000-10019 |
| minMM_GG  | Min mismatches (NGG)   | 4+               |
| minMM_AG  | Min mismatches (NAG)   | 4+               |
| seq       | 20bp spacer sequence   | ATCGATCG...      |
| Chr       | Chromosome             | Chr1             |
| cut_start | Cut position start     | 10000            |
| cut_end   | Cut position end       | 10019            |
| strand    | + or -                 | +                |
| location  | Exon/Intron/Intergenic | Exon             |
| PAM       | PAM sequence           | NGG              |
| class     | Classification         | B0               |
| gene_id   | Gene identifier        | Os01g01010       |
