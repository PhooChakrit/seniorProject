#!/bin/bash
set -eu
INPUT="$1"
BASE="${2:-${INPUT%.gff3}.sorted}"
if [ -z "$INPUT" ]; then echo "usage: sort_gff3_tabix.sh <input.gff3> [output_basename]" >&2; exit 1; fi
SORTED="${BASE}.gff3"
GZ="${SORTED}.gz"
grep -v '^#' "$INPUT" | awk -F'\t' 'NF>=5{print $1"\t"$4"\t"$0}' | sort -k1,1 -k2,2n | cut -f3- > "$SORTED"
bgzip -c "$SORTED" > "$GZ"
tabix -p gff "$GZ"
echo "Created: $GZ and ${GZ}.tbi"
