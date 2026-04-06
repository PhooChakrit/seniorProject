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

**Full bioinformatics pipeline** for CRISPR spacer analysis (runs inside the worker container, cwd = genome folder).

```bash
# From repo: used by worker; manual run typically via Docker exec in /data/genomes/<folder>
./complete_pipeline_run.sh <input_fasta> [variety_id] [start] [end] [pam] [spacer_len] [mismatches] [job_id] [contig]
```

Shared Python steps live under **`scripts/spacer/`** (mounted at `/app/scripts/spacer` in dev, copied into the image for production). The shell script calls them instead of generating inline `.py` files.

**Steps (summary):**

1. **Region prep** — `spacer/extract_region.py` (if start/end set) or symlink whole FASTA → `GENOME.fna`
2. **PAM search (NGG + NAG)** — fuzznuc + `spacer/extract_from_fuzznuc.py` per PAM
3. **Deduplication** — `spacer/build_unique_fasta.py` per PAM
4. **Off-targets** — vsearch + CRISPR-PLANTv2 helper scripts
5. **Classification** — `spacer/classify_spacers.py` (dual PAM + CRISPR-PLANT v2 classes A0…B2)
6. **Annotation** — `annotate_spacers.py` using `gff3` from `genome.json` in the genome folder when present
7. **Output** — `output/<jobId>.tsv`

**Output:**

- Queue/Worker mode: `output/<jobId>.tsv`
- Manual mode (no jobId arg): `output/spacers_classified.tsv`

---

### `scripts/spacer/` (per-cultivar helpers)

Reusable CLIs that read **`genomes/<Cultivar>/genome.json`** when you pass **`--genome <folder-or-id>`** (folder name such as `KDML`, or manifest `id` such as `kdml105`). See `genome_paths.py` for resolution rules.

| Script | Role |
| ------ | ---- |
| `extract_region.py` | Extract `[start,end]` from reference FASTA (`--input` or `--genome`) |
| `extract_from_fuzznuc.py` | fuzznuc table → `NGG_candidates.fa` / `NAG_candidates.fa` (`--work-dir`, `--prefix`) |
| `build_unique_fasta.py` | Deduplicate candidates → `*_unique.fa` |
| `classify_spacers.py` | Dual-PAM TSV to stdout (`--work-dir`, `--mismatches`, `--spacer-length`, `--pam-label`) |

Example (host, from repo root; requires Biopython):

```bash
python3 scripts/spacer/extract_region.py --genome KDML --contig ptg000001l --start 10000 --end 20000 -o genomes/KDML/REGION.fna
```

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

### `e2e_queue_smoke.sh`

End-to-end smoke test for queue + API flow:

- Register test user
- Submit `region_analysis` job
- Poll job status until complete
- Fetch parsed results (`results-data`) and print summary

```bash
chmod +x scripts/e2e_queue_smoke.sh
scripts/e2e_queue_smoke.sh
```

Optional environment overrides:

```bash
BASE_URL=http://localhost:3000 START_POS=1 END_POS=5000 TIMEOUT_SECONDS=240 scripts/e2e_queue_smoke.sh
```

---

## Complete Workflow

To generate fully annotated spacer data:

```bash
# 1. Run full pipeline (inside Docker, ~30-60 min)
./scripts/manual_pipeline_run.sh

# 2. Annotate with GFF3 (local)
python3 scripts/annotate_spacers.py \
  data/genomes/oryza/output/<jobId>.tsv \
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
