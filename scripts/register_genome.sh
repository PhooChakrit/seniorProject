#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/register_genome.sh --dir genomes/<CULTIVAR_FOLDER> [--gff3-index] [--check]

Options:
  --dir <path>      Cultivar folder containing genome.json
  --gff3-index      Generate bgzip + tabix index for gff3 (optional)
  --check           Validate only (no writes)
  -h, --help        Show this help

What this script does:
  1) Validates genome.json fields: id, label, fasta, gff3
  2) Ensures FASTA exists and generates FASTA index (.fai)
  3) Optionally generates GFF3 indexes (.gz and .tbi)
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

GENOME_DIR=""
CHECK_ONLY="false"
MAKE_GFF3_INDEX="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      GENOME_DIR="${2:-}"
      shift 2
      ;;
    --check)
      CHECK_ONLY="true"
      shift
      ;;
    --gff3-index)
      MAKE_GFF3_INDEX="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$GENOME_DIR" ]]; then
  echo "--dir is required" >&2
  usage
  exit 1
fi

if [[ ! -d "$GENOME_DIR" ]]; then
  echo "Genome directory not found: $GENOME_DIR" >&2
  exit 1
fi

MANIFEST="$GENOME_DIR/genome.json"
if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

require_cmd python3
require_cmd samtools

readarray -t MANIFEST_FIELDS < <(
  python3 - "$MANIFEST" <<'PY'
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
data = json.loads(manifest_path.read_text(encoding="utf-8"))
required = ("id", "label", "fasta", "gff3")
missing = [k for k in required if not data.get(k)]
if missing:
    raise SystemExit("Missing required fields in genome.json: " + ", ".join(missing))

print(data["id"])
print(data["label"])
print(data["fasta"])
print(data["gff3"])
PY
)

GENOME_ID="${MANIFEST_FIELDS[0]}"
GENOME_LABEL="${MANIFEST_FIELDS[1]}"
FASTA_REL="${MANIFEST_FIELDS[2]}"
GFF3_REL="${MANIFEST_FIELDS[3]}"

FASTA_PATH="$GENOME_DIR/$FASTA_REL"
GFF3_PATH="$GENOME_DIR/$GFF3_REL"
FAI_PATH="${FASTA_PATH}.fai"

if [[ ! -f "$FASTA_PATH" ]]; then
  echo "FASTA not found: $FASTA_PATH" >&2
  exit 1
fi

if [[ ! -f "$GFF3_PATH" ]]; then
  echo "GFF3 not found: $GFF3_PATH" >&2
  exit 1
fi

echo "Valid manifest:"
echo "  id: $GENOME_ID"
echo "  label: $GENOME_LABEL"
echo "  fasta: $FASTA_REL"
echo "  gff3: $GFF3_REL"

if [[ "$CHECK_ONLY" == "true" ]]; then
  echo "Check-only mode: no files were modified."
  exit 0
fi

echo "Generating FASTA index (.fai)..."
samtools faidx "$FASTA_PATH"
echo "Created: $FAI_PATH"

if [[ "$MAKE_GFF3_INDEX" == "true" ]]; then
  require_cmd bgzip
  require_cmd tabix
  GFF3_GZ="${GFF3_PATH}.gz"
  GFF3_TBI="${GFF3_GZ}.tbi"
  echo "Generating GFF3 bgzip + tabix indexes..."
  bgzip -c "$GFF3_PATH" > "$GFF3_GZ"
  tabix -p gff "$GFF3_GZ"
  echo "Created: $GFF3_GZ"
  echo "Created: $GFF3_TBI"
fi

echo "Genome registration preparation complete."
