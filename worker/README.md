# Worker Service & Bioinformatics Pipeline

This directory contains the **Python worker service** responsible for executing the CRISPR-PLANTv2 bioinformatics pipeline asynchronously.

---

## What the Worker Does

The worker handles one primary job type: **`region_analysis`**

Given a genomic region (start–end bp) and analysis parameters (PAM, spacer length, mismatches), it:

1. Extracts the target region from the genome FASTA
2. Finds all spacer candidates with the specified PAM on both strands
3. Runs off-target analysis against both NGG and NAG PAMs (dual PAM mode)
4. Classifies each spacer by specificity (A0, B0, Off-Target)
5. Annotates each spacer with its genomic location (Exon / Intron / Intergenic) and gene ID via GFF3

Output is a TSV file saved to `genomes/<VARIETY>/output/<jobId>.tsv`.

---

## Full Flow — From "Start Analysis" to Results

```
User (Browser)
     │
     │  1. Fill form: variety, region, PAM, spacer length, mismatches
     │     Click "Start Analysis"
     ▼
Frontend (React)
     │
     │  POST /api/analysis/submit
     │  { variety, startPos, endPos, options: { pam, spacerLength, mismatches, email } }
     ▼
API Server (Express)
     │
     │  - Validates input (variety required, endPos > startPos)
     │  - Creates SearchJob record in PostgreSQL (status: "pending")
     │  - Publishes message to RabbitMQ queue: crispr_tasks
     │  - Returns { jobId } to frontend immediately
     ▼
RabbitMQ (Queue: crispr_tasks)
     │
     │  Message: { type: "region_analysis", jobId, variety, startPos, endPos, options }
     ▼
Worker (worker.py)
     │
     │  - Picks up message from queue
     │  - Updates job status → "processing" (via API: POST /api/genome/jobs/update)
     │  - Resolves genome FASTA path from VARIETY_CONFIG
     │  - Calls: /bin/bash /app/scripts/complete_pipeline_run.sh
     │           <genome.fasta> <variety> <start> <end> <pam> <spacerLength> <mismatches> <jobId>
     ▼
Pipeline (complete_pipeline_run.sh)
     │
     │  Step 0 — Region Extraction
     │    extract_region.py (BioPython)
     │    Cuts genome FASTA at [startPos:endPos] → REGION.fna / GENOME.fna
     │
     │  Step 1 — PAM Search: NGG
     │    fuzznuc -pattern "N(<spacerLen>)NGG" -complement
     │    → NGG_candidates.fa  (all spacer+PAM hits, both strands)
     │
     │  Step 2 — PAM Search: NAG  (for off-target estimation)
     │    fuzznuc -pattern "N(<spacerLen>)NAG" -complement
     │    → NAG_candidates.fa
     │
     │  Step 3 — Off-target Analysis (vsearch, per PAM)
     │    For each PAM (NGG and NAG):
     │      vsearch --usearch_global  (identity = 1 - MM/spacerLen)
     │      → *_global.<MM>MM  and  *_global.<MM-1>MM
     │    CRISPR-PLANTv2 scripts:
     │      cp_global_2MM.py  → local off-target lists
     │      cp_global_3MM.py
     │      cp_remove_10bp_adjacent_spacers.py  → filter adjacent hits
     │    → NGG_off_<MM>.ids,  NAG_off_<MM>.ids
     │
     │  Step 4 — Spacer Classification  (classify_spacers.py)
     │    For each NGG spacer candidate:
     │      minMM_GG = min mismatches to any NGG off-target site
     │      minMM_AG = min mismatches to any NAG off-target site
     │      class:
     │        A0  — specific to NGG AND NAG  (best)
     │        B0  — specific to NGG, has NAG off-target
     │        Off-Target — has NGG off-target
     │    → output/<jobId>.raw.tsv
     │
     │  Step 5 — Genomic Annotation  (annotate_spacers.py + GFF3)
     │    Maps each spacer coordinate to:
     │      location: Exon / Intron / Intergenic
     │      gene_id:  nearest gene
     │    GFF3 file: /data/genomes/KDML/KDML105.gff3
     │    Falls back to raw TSV if GFF3 not available
     │    → output/<jobId>.tsv  (final output)
     │
     ▼
Worker (worker.py) — after pipeline exits
     │
     │  - Updates job status → "completed" with outputFile path
     │    (via API: POST /api/genome/jobs/update)
     │  - Sends email notification if configured
     │    (via API: POST /api/analysis/notify/<jobId>)
     ▼
Frontend — polling every 5 seconds (AnalysisPage)
     │
     │  GET /api/analysis/jobs  → detects status "completed"
     │  User clicks "View Results"  →  navigates to /analysis/results/<jobId>
     ▼
AnalysisResultsPage
     │
     │  GET /api/analysis/results-data/<jobId>
     │  API reads output/<jobId>.tsv, parses each row
     │  Returns: { results: [ { seqId, start, end, minMM_GG, minMM_AG,
     │                           seq, pam, strand, location, spacerClass }, ... ] }
     ▼
Table display + Export CSV
```

---

## Output TSV Columns

| Column       | Description                                                  |
| :----------- | :----------------------------------------------------------- |
| `seqId`      | Spacer identifier — `Chr:start-end` or `Chr:start-end:rc`   |
| `minMM_GG`   | Minimum mismatches to any NGG off-target (`N+` = none found) |
| `minMM_AG`   | Minimum mismatches to any NAG off-target (`N+` = none found) |
| `seq`        | Spacer sequence (5'→3', protospacer only, no PAM)           |
| `Chr`        | Chromosome / contig name                                     |
| `cut_start`  | Genomic cut start position (bp)                              |
| `cut_end`    | Genomic cut end position (bp)                                |
| `strand`     | `+` or `-`                                                   |
| `location`   | `Exon` / `Intron` / `Intergenic` / `Gene`                   |
| `PAM`        | PAM sequence used (e.g. `NGG`)                               |
| `class`      | `A0`, `B0`, or `Off-Target`                                  |
| `gene_id`    | Gene ID from GFF3 annotation (if applicable)                 |

---

## Spacer Classification

| Class      | Meaning                                                              |
| :--------- | :------------------------------------------------------------------- |
| `A0`       | No off-target found under NGG **or** NAG — most specific            |
| `B0`       | No NGG off-target, but has NAG off-target — moderately specific     |
| `Off-Target` | Has NGG off-target within mismatch threshold — use with caution   |

---

## Job Payload (RabbitMQ Message)

```json
{
  "type": "region_analysis",
  "jobId": "analysis_1741234567890_abc123",
  "variety": "kdml105",
  "startPos": 10000,
  "endPos": 60000,
  "options": {
    "pam": "NGG",
    "spacerLength": 20,
    "mismatches": 3,
    "email": "user@example.com"
  }
}
```

---

## Supported Parameters

| Parameter      | Default | Range / Options    | Description                              |
| :------------- | :------ | :----------------- | :--------------------------------------- |
| `variety`      | —       | `kdml105`          | Rice variety → selects genome FASTA      |
| `startPos`     | —       | ≥ 1                | Region start position (bp)               |
| `endPos`       | —       | startPos + 1..+100,000 | Region end (max 100,000 bp window)  |
| `pam`          | `NGG`   | `NGG`              | PAM pattern (only NGG supported now)     |
| `spacerLength` | `20`    | 17–24              | Spacer/protospacer length in bp          |
| `mismatches`   | `3`     | 0–4                | Off-target mismatch tolerance            |

---

## Supported Varieties

| Variety Key | Name                  | Genome File             | GFF3 Annotation        |
| :---------- | :-------------------- | :---------------------- | :--------------------- |
| `kdml105`   | KDML105 (ข้าวหอมมะลิ) | `KDML/KDML105.fasta`    | `KDML/KDML105.gff3`    |

---

## Architecture

```
[RabbitMQ: crispr_tasks]
        │
        ▼
   worker.py
   process_region_analysis()
        │
        ▼
   complete_pipeline_run.sh
   ├── extract_region.py       (BioPython — region extraction)
   ├── fuzznuc                 (EMBOSS — PAM search NGG + NAG)
   ├── vsearch                 (off-target alignment)
   ├── cp_global_2MM.py        (CRISPR-PLANTv2)
   ├── cp_global_3MM.py        (CRISPR-PLANTv2)
   ├── cp_remove_10bp_...py    (CRISPR-PLANTv2)
   ├── classify_spacers.py     (inline — dual PAM classification)
   └── annotate_spacers.py     (GFF3-based location annotation)
        │
        ▼
   output/<jobId>.tsv
```

---

## Development

### Running the Worker

```bash
# Start all services
docker compose up -d

# Rebuild worker after code changes
docker compose up -d --build worker

# View worker logs
docker compose logs -f worker
```

### Script Source of Truth

- Active pipeline entrypoint: `/app/scripts/complete_pipeline_run.sh`
  (mounted from project root `./scripts/`)
- `worker/complete_pipeline_run.sh` is kept in sync for build compatibility
