#!/usr/bin/env python3
"""Classify spacer candidates using NGG/NAG off-target id lists (dual PAM)."""

from __future__ import annotations

import argparse
from pathlib import Path


def load_ids(path: Path) -> set[str]:
    ids: set[str] = set()
    try:
        with open(path) as f:
            for line in f:
                value = line.strip().split()
                if value:
                    ids.add(value[0])
    except OSError:
        pass
    return ids


def load_repr_map(path: Path) -> dict[str, str]:
    repr_to_seq: dict[str, str] = {}
    current_id = ""
    seq_chunks: list[str] = []

    def flush_record() -> None:
        nonlocal current_id, seq_chunks
        if not current_id:
            return
        seq = "".join(seq_chunks).strip()
        if seq:
            repr_to_seq[current_id] = seq
        current_id = ""
        seq_chunks = []

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
    except OSError:
        pass
    return repr_to_seq


def ids_to_sequences(ids: set[str], repr_to_seq: dict[str, str]) -> set[str]:
    return {repr_to_seq[i] for i in ids if i in repr_to_seq}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--work-dir", type=Path, default=Path("."))
    p.add_argument("--mismatches", type=int, default=3)
    p.add_argument(
        "--pam-label",
        default="NGG",
        help="Printed in TSV PAM column (primary selection from UI)",
    )
    args = p.parse_args()
    work = args.work_dir.resolve()
    mismatches = args.mismatches

    candidates_file = work / "NGG_candidates.fa"
    unique_file = work / "NGG_unique.fa"

    repr_to_seq = load_repr_map(unique_file)

    ngg_off_minus1_ids = load_ids(work / f"NGG_off_{mismatches}MM_minus1.ids")
    ngg_off_full_ids = load_ids(work / f"NGG_off_{mismatches}MM.ids")
    ngg_off_minus1_seqs = ids_to_sequences(ngg_off_minus1_ids, repr_to_seq)
    ngg_off_full_seqs = ids_to_sequences(ngg_off_full_ids, repr_to_seq)

    nag_off_minus1_ids = load_ids(work / f"NAG_off_{mismatches}MM_minus1.ids")
    nag_off_full_ids = load_ids(work / f"NAG_off_{mismatches}MM.ids")
    nag_off_minus1_seqs = ids_to_sequences(nag_off_minus1_ids, repr_to_seq)
    nag_off_full_seqs = ids_to_sequences(nag_off_full_ids, repr_to_seq)

    print(
        "seqID\tminMM_GG\tminMM_AG\tseq\tChr\tcut_start\tcut_end\tstrand\tlocation\tPAM\tclass"
    )

    current_id = ""
    with open(candidates_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                current_id = line[1:]
            elif line:
                if not current_id:
                    continue
                seq = line
                try:
                    parts = current_id.split(":")
                    chrom = parts[0]
                    range_s = parts[1]
                    start, end = range_s.split("-")
                    strand = "-" if ":rc" in current_id else "+"
                except (IndexError, ValueError):
                    chrom = "Unknown"
                    start = "0"
                    end = "0"
                    strand = "?"

                min_mm_gg = str(mismatches + 1) + "+"
                if seq in ngg_off_minus1_seqs:
                    min_mm_gg = str(mismatches - 1)
                elif seq in ngg_off_full_seqs:
                    min_mm_gg = str(mismatches)

                min_mm_ag = str(mismatches + 1) + "+"
                if seq in nag_off_minus1_seqs:
                    min_mm_ag = str(mismatches - 1)
                elif seq in nag_off_full_seqs:
                    min_mm_ag = str(mismatches)

                if min_mm_gg.endswith("+") and min_mm_ag.endswith("+"):
                    s_class = "A0"
                elif min_mm_gg.endswith("+"):
                    s_class = "B0"
                else:
                    s_class = "Off-Target"

                print(
                    f"{current_id}\t{min_mm_gg}\t{min_mm_ag}\t{seq}\t{chrom}\t{start}\t{end}\t{strand}\tNA\t{args.pam_label}\t{s_class}"
                )


if __name__ == "__main__":
    main()
