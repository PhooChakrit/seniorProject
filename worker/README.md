# Worker Service & Bioinformatics Pipeline

This directory contains the legacy **Python 2.7** worker service responsibly for executing the CRISPR-PLANTv2 bioinformatics pipeline.

## Architecture

The system operates on an asynchronous job queue model:

1.  **API/Producer** sends a job JSON to the **RabbitMQ** queue `crispr_tasks`.
2.  **Worker (Python 2.7)** picks up the message.
3.  **Worker** executes the pipeline script (`run_pipeline.sh`) using the `CRISPR-PLANTv2` legacy tools.
4.  **Results** are generated in the Docker container (and can be processed/saved as needed).

## The Pipeline

The pipeline (`run_pipeline.sh`) consists of the following steps:

1.  **PAM Search (`fuzznuc`)**:
    Internal tool `fuzznuc` scans the genome for the specified PAM pattern (default: `N(20)NGG`).
    _Output_: `GENOME_NGG_spacers.fuzznuc`

2.  **Conversion**:
    A Python script converts the fuzznuc output into a standard FASTA format (`.fa`) and ID list.
    _Output_: `GENOME_NGG_spacers.fa`

3.  **Clustering (`vsearch`)**:
    `vsearch` is used to cluster sequences and remove duplicates/near-duplicates based on identity and length.
    _Output_: `GENOME_NGG_spacers_unique.fa`

## Configuration (Dynamic Parameters)

Researchers can configure pipeline parameters per-job by passing an `options` object in the JSON payload.

### Job Payload Example

```json
{
  "genome_file": "Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa",
  "options": {
    "PAM_PATTERN": "N(20)NGG",      # Optional: Custom PAM pattern
    "MIN_SEQ_LENGTH": "20"          # Optional: Minimum sequence length for clustering
  }
}
```

### Supported Parameters

| Parameter        | Default    | Description                               |
| :--------------- | :--------- | :---------------------------------------- |
| `PAM_PATTERN`    | `N(20)NGG` | Pattern for `fuzznuc` to search for.      |
| `MIN_SEQ_LENGTH` | `20`       | Minimum length for `vsearch` to consider. |

## Development & Testing

### Running the Worker

The worker is managed via Docker Compose.

```bash
# Start all services (Worker, RabbitMQ, API, Frontend)
docker-compose up -d

# Rebuild worker after code changes
docker-compose up -d --build worker
```

### Manual Testing with Docker

You can manually trigger the pipeline inside the container to verify changes:

```bash
# Run the pipeline wrapper directly
docker-compose run --rm worker /app/run_pipeline.sh /data/genomes/oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa
```
