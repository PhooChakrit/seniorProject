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
OUTPUT_DIR="output"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: complete_pipeline_run.sh <input_fasta> [species] [start_pos] [end_pos] [pam] [spacer_length] [mismatches]"
    exit 1
fi

echo "--- Starting Complete Pipeline (Dual PAM Mode) ---"
echo "Input File: $INPUT_FILE"
echo "Species: $SPECIES"
if [ -n "$START_POS" ] && [ "$START_POS" != "0" ]; then
    echo "Region: $START_POS - $END_POS"
fi
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

# 1. Prepare Genome File (extract region if start/end specified)
if [ -n "$START_POS" ] && [ -n "$END_POS" ]; then
    echo "[0/6] Extracting region $START_POS-$END_POS from genome..."
    cat <<PYEOF > extract_region.py
#!/usr/bin/env python
from Bio import SeqIO
from Bio.SeqRecord import SeqRecord

input_file = "$INPUT_FILE"
start_pos = $START_POS
end_pos = $END_POS
output_file = "REGION.fna"

print("Loading genome from %s..." % input_file)
record = next(SeqIO.parse(input_file, "fasta"))
print("Genome length: %d" % len(record.seq))

region_seq = record.seq[start_pos-1:end_pos]
region_record = SeqRecord(region_seq, id="%s:%d-%d" % (record.id, start_pos, end_pos), description="")

with open(output_file, "w") as out:
    SeqIO.write(region_record, out, "fasta")

print("Extracted region: %d bp" % len(region_seq))
PYEOF
    python3 extract_region.py
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
    
    # Extract spacers
    cat <<EOF > extract_${PREFIX}.py
from Bio import SeqIO

genome_file = "GENOME.fna"
fuzznuc_file = "${PREFIX}_spacers.fuzznuc"
output_file = "${PREFIX}_candidates.fa"

record = next(SeqIO.parse(genome_file, "fasta"))
genome_seq = record.seq
record_id = record.id
base_chr = record_id.split(":", 1)[0]

# If GENOME.fna is an extracted region (e.g., ptg000001l:10000-60000),
# convert fuzznuc's region-relative coordinates back to genome coordinates.
region_offset = 0
if ":" in record_id:
    coord_part = record_id.split(":", 1)[1]
    if "-" in coord_part:
        try:
            region_start = int(coord_part.split("-", 1)[0])
            region_offset = region_start - 1
        except ValueError:
            region_offset = 0

with open(fuzznuc_file) as f, open(output_file, 'w') as out:
    count = 0
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("Start"): continue
        parts = line.split()
        if len(parts) < 3: continue
        try:
            start = int(parts[0])
            end = int(parts[1])
            strand = parts[2]
            seq_slice = genome_seq[start-1:end]
            final_seq = str(seq_slice)
            if strand == "-":
                final_seq = str(seq_slice.reverse_complement())
            genome_start = start + region_offset
            genome_end = end + region_offset
            strand_label = ":rc" if strand == "-" else ""
            header = f">{base_chr}:{genome_start}-{genome_end}{strand_label}"
            out.write(f"{header}\n{final_seq}\n")
            count += 1
        except ValueError:
            continue
    print(f"[${PREFIX}] Extracted {count} spacers.")
EOF
    python3 extract_${PREFIX}.py
    
    # Run vsearch
    VSEARCH_ID=$(python3 -c "print(1.0 - float($MISMATCHES) / float($SPACER_LENGTH))")
    VSEARCH_ID_MINUS_1=$(python3 -c "print(1.0 - float($MISMATCHES - 1) / float($SPACER_LENGTH))")
    
    cat <<EOF > build_unique_${PREFIX}.py
from collections import OrderedDict

input_fasta = "${PREFIX}_candidates.fa"
output_fasta = "${PREFIX}_unique.fa"

seq_to_first_id = OrderedDict()
current_id = ""
seq_chunks = []

def flush_record():
    if not current_id:
        return
    seq = "".join(seq_chunks).strip()
    if seq and seq not in seq_to_first_id:
        seq_to_first_id[seq] = current_id

with open(input_fasta) as f:
    for raw_line in f:
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith(">"):
            flush_record()
            current_id = line[1:]
            seq_chunks = []
        else:
            seq_chunks.append(line)
    flush_record()

with open(output_fasta, "w") as out:
    for seq, seq_id in seq_to_first_id.items():
        out.write(f">{seq_id}\n{seq}\n")
EOF
    python3 build_unique_${PREFIX}.py
    
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

cat <<EOF > classify_spacers.py
import sys

# Use NGG candidates as primary (since user selected NGG typically)
candidates_file = "NGG_candidates.fa"
unique_file = "NGG_unique.fa"
pam_used = "$PAM"
mismatches = $MISMATCHES

def load_ids(path):
    ids = set()
    try:
        with open(path) as f:
            for line in f:
                value = line.strip().split()
                if value:
                    ids.add(value[0])
    except:
        pass
    return ids

def load_repr_map(path):
    repr_to_seq = {}
    current_id = ""
    seq_chunks = []

    def flush_record():
        if not current_id:
            return
        seq = "".join(seq_chunks).strip()
        if seq:
            repr_to_seq[current_id] = seq

    try:
        with open(path) as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line:
                    continue
                if line.startswith(">"):
                    flush_record()
                    current_id = line[1:]
                    seq_chunks = []
                else:
                    seq_chunks.append(line)
            flush_record()
    except:
        pass
    return repr_to_seq

def ids_to_sequences(ids, repr_to_seq):
    return set(repr_to_seq[seq_id] for seq_id in ids if seq_id in repr_to_seq)

# Load representative sequence map from NGG_unique.fa.
repr_to_seq = load_repr_map(unique_file)

# Load NGG off-target IDs and convert to sequences.
ngg_off_minus1_ids = load_ids(f"NGG_off_{mismatches}MM_minus1.ids")
ngg_off_full_ids = load_ids(f"NGG_off_{mismatches}MM.ids")
ngg_off_minus1_seqs = ids_to_sequences(ngg_off_minus1_ids, repr_to_seq)
ngg_off_full_seqs = ids_to_sequences(ngg_off_full_ids, repr_to_seq)

# Load NAG off-target IDs and convert to sequences.
nag_off_minus1_ids = load_ids(f"NAG_off_{mismatches}MM_minus1.ids")
nag_off_full_ids = load_ids(f"NAG_off_{mismatches}MM.ids")
nag_off_minus1_seqs = ids_to_sequences(nag_off_minus1_ids, repr_to_seq)
nag_off_full_seqs = ids_to_sequences(nag_off_full_ids, repr_to_seq)

print("seqID\tminMM_GG\tminMM_AG\tseq\tChr\tcut_start\tcut_end\tstrand\tlocation\tPAM\tclass")

current_id = ""
with open(candidates_file) as f:
    for line in f:
        line = line.strip()
        if line.startswith(">"):
            current_id = line[1:]
        else:
            if not current_id: continue
            seq = line
            
            try:
                parts = current_id.split(':')
                chrom = parts[0]
                range_s = parts[1]
                start, end = range_s.split('-')
                strand = "-" if ":rc" in current_id else "+"
            except:
                chrom="Unknown"; start="0"; end="0"; strand="?"
            
            # Calculate minMM_GG
            min_mm_gg = str(mismatches + 1) + "+"
            if seq in ngg_off_minus1_seqs:
                min_mm_gg = str(mismatches - 1)
            elif seq in ngg_off_full_seqs:
                min_mm_gg = str(mismatches)
            
            # Calculate minMM_AG
            min_mm_ag = str(mismatches + 1) + "+"
            if seq in nag_off_minus1_seqs:
                min_mm_ag = str(mismatches - 1)
            elif seq in nag_off_full_seqs:
                min_mm_ag = str(mismatches)
            
            # Determine class based on both
            if min_mm_gg.endswith("+") and min_mm_ag.endswith("+"):
                s_class = "A0"  # Highly specific to both
            elif min_mm_gg.endswith("+"):
                s_class = "B0"  # Specific to NGG but has NAG off-target
            else:
                s_class = f"Off-Target"
            
            print(f"{current_id}\t{min_mm_gg}\t{min_mm_ag}\t{seq}\t{chrom}\t{start}\t{end}\t{strand}\tNA\tNGG\t{s_class}")
EOF

RAW_TSV="$OUTPUT_DIR/${JOB_ID}.raw.tsv"
FINAL_TSV="$OUTPUT_DIR/${JOB_ID}.tsv"

python3 classify_spacers.py > "$RAW_TSV"

# 5.5 Annotate with real GFF3 (location + gene_id)
echo "[5.5/6] Annotating spacers with GFF3..."

ANNOTATION_FILE=""
case "$SPECIES" in
    kdml105)
        ANNOTATION_FILE="/data/genomes/KDML/KDML105.gff3"
        ;;
esac

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
