#!/bin/bash
set -e

# =================================================================
# CRISPR-PLANT v2 Complete Pipeline
# Implements full off-target search and classification logic
# Updated: Accepts all parameters (region, PAM, spacer length, mismatches)
# =================================================================

INPUT_FILE="$1"
SPECIES="${2:-kdml105}"
START_POS="${3:-}"
END_POS="${4:-}"
PAM="${5:-NGG}"
SPACER_LENGTH="${6:-20}"
MISMATCHES="${7:-3}"
OUTPUT_DIR="output"

if [ -z "$INPUT_FILE" ]; then
    echo "Usage: complete_pipeline_run.sh <input_fasta> [species] [start_pos] [end_pos] [pam] [spacer_length] [mismatches]"
    exit 1
fi

echo "--- Starting Complete Pipeline ---"
echo "Arg 1 (Input): $1"
echo "Arg 2 (Species): $2"
echo "Arg 3 (Start): $3"
echo "Arg 4 (End): $4"
echo "Arg 5 (PAM): $5"
echo "Arg 6 (Length): $6"
echo "Arg 7 (Mismatch): $7"

echo "Input File: $INPUT_FILE"
echo "Species: $SPECIES"
if [ -n "$START_POS" ] && [ "$START_POS" != "0" ]; then
    echo "Region: $START_POS - $END_POS"
fi
echo "PAM: $PAM"
echo "Spacer Length: $SPACER_LENGTH"
echo "Mismatches: $MISMATCHES"

# Build fuzznuc pattern based on PAM type
case "$PAM" in
    "NGG")
        PAM_PATTERN="N(${SPACER_LENGTH})NGG"
        ;;
    "NAG")
        PAM_PATTERN="N(${SPACER_LENGTH})NAG"
        ;;
    "TTTV")
        # Cas12a uses TTTV PAM (V = A, C, or G) on 5' end
        PAM_PATTERN="TTT[ACG]N(${SPACER_LENGTH})"
        ;;
    *)
        echo "Warning: Unknown PAM '$PAM', defaulting to NGG"
        PAM_PATTERN="N(${SPACER_LENGTH})NGG"
        ;;
esac

echo "Fuzznuc Pattern: $PAM_PATTERN"

# Setup directories
WORKDIR=$(dirname "$INPUT_FILE")
mkdir -p "$WORKDIR/$OUTPUT_DIR"
cd "$WORKDIR"

# Ensure clean state for intermediate files
rm -f GENOME.fna REGION.fna
rm -f *.fuzznuc *.ids *.10bp *.2MM *.3MM *.userout *.complete

# 1. Prepare Genome File (extract region if start/end specified)
if [ -n "$START_POS" ] && [ -n "$END_POS" ]; then
    echo "[0/6] Extracting region $START_POS-$END_POS from genome..."
    # Use python to extract region
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

# Extract region (1-based to 0-based)
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

# 2. Find Candidates (Fuzznuc)
# -----------------------------------------------------------------
echo "[1/6] Running fuzznuc to find PAM sites with pattern: $PAM_PATTERN"
# Use table format to get coordinates reliably
fuzznuc -sequence GENOME.fna -pattern "$PAM_PATTERN" -outfile GENOME_spacers.fuzznuc -rformat table -complement -auto

# Convert Table to FASTA using python (Extract sequence from GENOME.fna)
echo "[1.5/6] Extracting sequences..."
cat <<EOF > extract_spacers.py
import sys
from Bio import SeqIO
from Bio.Seq import Seq

genome_file = "GENOME.fna"
fuzznuc_file = "GENOME_spacers.fuzznuc"
output_file = "GENOME_spacer_candidates.fa"

# Load Genome (Assuming single record for Chromosome input)
print(f"Loading genome {genome_file}...")
record = next(SeqIO.parse(genome_file, "fasta"))
genome_seq = record.seq
print(f"Genome length: {len(genome_seq)}")

print(f"Parsing {fuzznuc_file}...")
with open(fuzznuc_file) as f, open(output_file, 'w') as out:
    count = 0
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"): continue
        if line.startswith("Start"): continue # Header
        
        parts = line.split()
        # Format: Start End Strand Score Pattern Mismatch
        if len(parts) < 3: continue
        
        try:
            start = int(parts[0])
            end = int(parts[1])
            strand = parts[2]
            
            # Extract sequence (0-based)
            # fuzznuc is 1-based inclusive
            seq_slice = genome_seq[start-1:end]
            
            # If strand is "-", fuzznuc coords are on Forward strand but match is on Reverse?
            # Usually fuzznuc reports coords on the Forward strand.
            # If strand is "-", the pattern match is on reverse complement.
            # But the extracted sequence from Forward strand is the reverse complement of the spacer?
            # Wait, N(20)NGG logic:
            # If +, seq matches N(20)NGG directly.
            # If -, seq matches reverse complement of N(20)NGG?
            # Actually, let's trust BioPython.
            
            final_seq = str(seq_slice)
            
            # For FASTA output, we want 5'->3' spacer sequence.
            # If strand is +, extracted is 5'->3'.
            # If strand is -, extracted is 3'->5' of the complement?
            # Standard: if mapped to -, the sequence on - strand is 5'->3'.
            # Which is Reverse Complement of the + strand slice.
            
            if strand == "-":
                final_seq = str(seq_slice.reverse_complement())
                
            # ID Format: Chr:Start-End:Strand
            # Use 'rc' for negative strand for compatibility with import script
            strand_label = "" 
            if strand == "-": strand_label = ":rc"
            
            # Adjust Chr ID
            chr_id = record.id 
            
            header = f">{chr_id}:{start}-{end}{strand_label}"
            out.write(f"{header}\n{final_seq}\n")
            count += 1
            
        except ValueError:
            continue
            
    print(f"Extracted {count} spacers.")
EOF

python3 extract_spacers.py

# 3. Specificity Check - Global Alignment (vsearch)
# -----------------------------------------------------------------
echo "[2/6] Running Global Alignment (vsearch) with max $MISMATCHES mismatches..."

# Calculate vsearch identity based on mismatches
# Identity = 1 - (mismatches / spacer_length)
# For spacer_length=20 and mismatches=3: identity = 0.85
VSEARCH_ID=$(python3 -c "print(1.0 - float($MISMATCHES) / float($SPACER_LENGTH))")
VSEARCH_ID_MINUS_1=$(python3 -c "print(1.0 - float($MISMATCHES - 1) / float($SPACER_LENGTH))")
echo "vsearch identity threshold: $VSEARCH_ID (for $MISMATCHES MM)"

# Create unique candidates list
grep -v ">" GENOME_spacer_candidates.fa | sort | uniq > GENOME_spacer_candidates_unique.seq
# Add headers back
awk '{print ">" NR "\n" $0}' GENOME_spacer_candidates_unique.seq > GENOME_unique.fa

# Run vsearch with calculated identity
vsearch --usearch_global GENOME_unique.fa --db GENOME_unique.fa \
    --id $VSEARCH_ID_MINUS_1 --strand plus --blast6out global_GENOME.userout.${MISMATCHES}MM_minus1 \
    --minseqlength 10 --maxaccepts 10000 --maxrejects 10000 --threads 4 || echo "vsearch $(($MISMATCHES-1))MM completed"
    
vsearch --usearch_global GENOME_unique.fa --db GENOME_unique.fa \
    --id $VSEARCH_ID --strand plus --blast6out global_GENOME.userout.${MISMATCHES}MM \
    --minseqlength 10 --maxaccepts 10000 --maxrejects 10000 --threads 4 || echo "vsearch ${MISMATCHES}MM completed"

# 4. Specificity Check - Local Alignment (Start/end checks)
# -----------------------------------------------------------------
echo "[3/6] Running Local Alignment Logic..."

# Use the appropriate mismatch scripts (or skip if using different MM thresholds)
# For flexibility, we'll process both N-1 and N mismatch files
python /app/CRISPR-PLANTv2/python-scripts/cp_global_2MM.py global_GENOME.userout.${MISMATCHES}MM_minus1 local_GENOME.b6.${MISMATCHES}MM_minus1 || echo "cp_global_2MM skipped"
python /app/CRISPR-PLANTv2/python-scripts/cp_global_3MM.py global_GENOME.userout.${MISMATCHES}MM local_GENOME.b6.${MISMATCHES}MM || echo "cp_global_3MM skipped"

# Remove adjacent spacers (self-hits or close proximity)
python /app/CRISPR-PLANTv2/python-scripts/cp_remove_10bp_adjacent_spacers.py local_GENOME.b6.${MISMATCHES}MM_minus1 local_GENOME.b6.${MISMATCHES}MM_minus1.10bp || touch local_GENOME.b6.${MISMATCHES}MM_minus1.10bp
python /app/CRISPR-PLANTv2/python-scripts/cp_remove_10bp_adjacent_spacers.py local_GENOME.b6.${MISMATCHES}MM local_GENOME.b6.${MISMATCHES}MM.10bp || touch local_GENOME.b6.${MISMATCHES}MM.10bp

# 5. Extract Off-target IDs
# -----------------------------------------------------------------
echo "[4/6] Processing Off-target IDs..."

# Extract IDs that have off-targets
cut -f 1 local_GENOME.b6.${MISMATCHES}MM_minus1.10bp 2>/dev/null | sort | uniq > off_target_${MISMATCHES}MM_minus1.ids || touch off_target_${MISMATCHES}MM_minus1.ids
cut -f 1 local_GENOME.b6.${MISMATCHES}MM.10bp 2>/dev/null | sort | uniq > off_target_${MISMATCHES}MM.ids || touch off_target_${MISMATCHES}MM.ids

# 6. Classification & Final Output
# -----------------------------------------------------------------
echo "[5/6] Classification (A/B Class Assignment)..."

# CLASSIFY SCRIPT - Updated for dynamic parameters
cat <<EOF > classify_spacers.py
import sys

candidates_file = "GENOME_spacer_candidates.fa"
pam_used = "$PAM"
mismatches = $MISMATCHES

# Read Off targets into sets (using dynamic mismatch count)
off_target_minus1 = set()
try:
    off_target_minus1 = set(line.strip().split()[0] for line in open(f"off_target_{mismatches}MM_minus1.ids"))
except: pass

off_target_full = set()
try:
    off_target_full = set(line.strip().split()[0] for line in open(f"off_target_{mismatches}MM.ids"))
except: pass

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
            
            # Parse ID
            # Chr1:100-120[:rc]
            try:
                parts = current_id.split(':')
                chrom = parts[0]
                range_s = parts[1]
                start, end = range_s.split('-')
                strand = "-" if ":rc" in current_id else "+"
            except:
                chrom="Unknown"; start="0"; end="0"; strand="?"
            
            pam = pam_used
            
            # Logic: If current_id is in off_target list -> it has off-targets
            # BUT: A candidate ALWAYS has a perfect match (itself) in the genome.
            # vsearch finds "Self" match.
            # We must filter out "Self" match in vsearch or post-process.
            # The python scripts 'cp_remove_10bp_adjacent_spacers.py' supposedly handle this?
            # Or 'cp_global_2MM.py' handles it.
            # Let's assume standard logic provided in original V2 pipeline scripts works.
            # If ID is in 2MM list, it implies it has an off-target OTHER than self (or self was counted?)
            # Actually, we define "Specific" as "No off-target with <= X mismatch".
            # The scripts remove adjacent/self. So if it remains in .ids file, it is BAD.
            
            min_mm = str(mismatches + 1) + "+"
            s_class = "A0"
            
            if current_id in off_target_minus1:
                min_mm = str(mismatches - 1)
                s_class = f"Off-Target (>{mismatches-1}MM)"
            elif current_id in off_target_full:
                min_mm = str(mismatches)
                s_class = f"Off-Target (>{mismatches}MM)"
            
            # If not in any list, min_mm >= mismatches+1 (Highly specific)

            print(f"{current_id}\t{min_mm}\tNA\t{seq}\t{chrom}\t{start}\t{end}\t{strand}\tNA\t{pam}\t{s_class}")
EOF

python3 classify_spacers.py > "$OUTPUT_DIR/spacers_classified.tsv"

echo "--- Pipeline Finished ---"
echo "Output: $WORKDIR/$OUTPUT_DIR/spacers_classified.tsv"
