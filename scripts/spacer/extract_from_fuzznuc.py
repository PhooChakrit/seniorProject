#!/usr/bin/env python3
"""Convert fuzznuc table output to candidate spacer FASTA (NGG or NAG prefix)."""

from __future__ import annotations

import argparse
from pathlib import Path

from Bio import SeqIO


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--work-dir",
        type=Path,
        default=Path("."),
        help="Directory containing GENOME.fna and fuzznuc output",
    )
    p.add_argument(
        "--prefix",
        choices=("NGG", "NAG"),
        required=True,
        help="PAM prefix; reads {prefix}_spacers.fuzznuc, writes {prefix}_candidates.fa",
    )
    args = p.parse_args()
    work = args.work_dir.resolve()
    genome_file = work / "GENOME.fna"
    fuzznuc_file = work / f"{args.prefix}_spacers.fuzznuc"
    output_file = work / f"{args.prefix}_candidates.fa"

    records = list(SeqIO.parse(str(genome_file), "fasta"))
    if not records:
        raise SystemExit(f"GENOME.fna is empty or not valid FASTA: {genome_file}")
    record = records[0]
    genome_seq = record.seq
    record_id = record.id
    base_chr = record_id.split(":", 1)[0]

    region_offset = 0
    if ":" in record_id:
        coord_part = record_id.split(":", 1)[1]
        if "-" in coord_part:
            try:
                region_start = int(coord_part.split("-", 1)[0])
                region_offset = region_start - 1
            except ValueError:
                region_offset = 0

    count = 0
    with open(fuzznuc_file) as f, open(output_file, "w") as out:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("Start"):
                continue
            parts = line.split()
            if len(parts) < 3:
                continue
            try:
                start = int(parts[0])
                end = int(parts[1])
                strand = parts[2]
                seq_slice = genome_seq[start - 1 : end]
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
    print(f"[{args.prefix}] Extracted {count} spacers -> {output_file}")


if __name__ == "__main__":
    main()
