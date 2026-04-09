#!/usr/bin/env python3
"""Classify NGG spacer candidates (CRISPR-PLANT v2 style, dual PAM).

Uses the same tier logic as bminkenberg/CRISPR-PLANTv2 ``pipeline-commands.txt``:
Off-Target (NGG), then among NGG-clean: A/B by duplicate PAM-proximal 10 nt seed,
A2/B2 by exact 15 nt seed match to any NAG site in the workdir, then
A0/B0 vs A0.1/B0.1 vs A1/B1 from NAG off-target ID lists (full vs MM-1 tier).

Caveats vs full CRISPR-PLANT v2 genome run: this pipeline uses vsearch global-only
off-target lists (no usearch local merge), no dust masking, and A/B duplicate counts
are computed only over NGG-clean candidates in the current region — consistent with
a regional window, not a whole genome.
"""

from __future__ import annotations

import argparse
from collections import Counter
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


def load_fasta_sequences(path: Path) -> list[str]:
    out: list[str] = []
    chunks: list[str] = []
    try:
        with open(path) as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line:
                    continue
                if line.startswith(">"):
                    if chunks:
                        out.append("".join(chunks))
                    chunks = []
                else:
                    chunks.append(line)
        if chunks:
            out.append("".join(chunks))
    except OSError:
        pass
    return out


def ids_to_sequences(ids: set[str], repr_to_seq: dict[str, str]) -> set[str]:
    return {repr_to_seq[i] for i in ids if i in repr_to_seq}


def protospacer(full_seq: str, spacer_len: int) -> str:
    if len(full_seq) <= spacer_len:
        return full_seq
    return full_seq[:spacer_len]


def pam_proximal_10(ps: str) -> str:
    if len(ps) <= 10:
        return ps
    return ps[-10:]


def pam_proximal_15(ps: str) -> str:
    if len(ps) <= 15:
        return ps
    return ps[-15:]


def min_mm_labels(
    seq: str,
    off_minus1_seqs: set[str],
    off_full_seqs: set[str],
    mismatches: int,
) -> str:
    mm = str(mismatches + 1) + "+"
    if seq in off_minus1_seqs:
        mm = str(mismatches - 1)
    elif seq in off_full_seqs:
        mm = str(mismatches)
    return mm


def crispr_plant_class(
    *,
    seed10_count: int,
    seed15: str,
    nag15_seeds: set[str],
    in_nag_full: bool,
    in_nag_tight: bool,
) -> str:
    """Assign v2 class for one candidate (NGG-clean only; caller handles Off-Target)."""
    is_b = seed10_count > 1
    if seed15 in nag15_seeds:
        return "B2" if is_b else "A2"
    if is_b:
        if not in_nag_full:
            return "B0"
        if not in_nag_tight:
            return "B0.1"
        return "B1"
    if not in_nag_full:
        return "A0"
    if not in_nag_tight:
        return "A0.1"
    return "A1"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--work-dir", type=Path, default=Path("."))
    p.add_argument("--mismatches", type=int, default=3)
    p.add_argument(
        "--spacer-length",
        type=int,
        default=20,
        help="Protospacer length (5' part of hit; PAM excluded if sequence is longer)",
    )
    p.add_argument(
        "--pam-label",
        default="NGG",
        help="Printed in TSV PAM column (primary selection from UI)",
    )
    args = p.parse_args()
    work = args.work_dir.resolve()
    mismatches = args.mismatches
    spacer_len = args.spacer_length

    candidates_file = work / "NGG_candidates.fa"
    unique_file = work / "NGG_unique.fa"
    nag_candidates_file = work / "NAG_candidates.fa"

    repr_to_seq = load_repr_map(unique_file)

    ngg_off_minus1_ids = load_ids(work / f"NGG_off_{mismatches}MM_minus1.ids")
    ngg_off_full_ids = load_ids(work / f"NGG_off_{mismatches}MM.ids")
    ngg_off_minus1_seqs = ids_to_sequences(ngg_off_minus1_ids, repr_to_seq)
    ngg_off_full_seqs = ids_to_sequences(ngg_off_full_ids, repr_to_seq)

    nag_off_minus1_ids = load_ids(work / f"NAG_off_{mismatches}MM_minus1.ids")
    nag_off_full_ids = load_ids(work / f"NAG_off_{mismatches}MM.ids")
    nag_off_minus1_seqs = ids_to_sequences(nag_off_minus1_ids, repr_to_seq)
    nag_off_full_seqs = ids_to_sequences(nag_off_full_ids, repr_to_seq)

    nag_seqs = load_fasta_sequences(nag_candidates_file)
    nag15_seeds: set[str] = set()
    for s in nag_seqs:
        ps = protospacer(s, spacer_len)
        if len(ps) >= 15:
            nag15_seeds.add(pam_proximal_15(ps))

    clean_seed10: list[str] = []
    current_id = ""
    with open(candidates_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                current_id = line[1:]
            elif line and current_id:
                seq = line
                min_gg = min_mm_labels(
                    seq, ngg_off_minus1_seqs, ngg_off_full_seqs, mismatches
                )
                if min_gg.endswith("+"):
                    ps = protospacer(seq, spacer_len)
                    clean_seed10.append(pam_proximal_10(ps))

    seed10_counts = Counter(clean_seed10)

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

                min_mm_gg = min_mm_labels(
                    seq, ngg_off_minus1_seqs, ngg_off_full_seqs, mismatches
                )
                min_mm_ag = min_mm_labels(
                    seq, nag_off_minus1_seqs, nag_off_full_seqs, mismatches
                )

                if not min_mm_gg.endswith("+"):
                    s_class = "Off-Target"
                else:
                    ps = protospacer(seq, spacer_len)
                    s10 = pam_proximal_10(ps)
                    s15 = pam_proximal_15(ps)
                    cnt = seed10_counts.get(s10, 0)
                    s_class = crispr_plant_class(
                        seed10_count=cnt,
                        seed15=s15,
                        nag15_seeds=nag15_seeds,
                        in_nag_full=seq in nag_off_full_seqs
                        or seq in nag_off_minus1_seqs,
                        in_nag_tight=seq in nag_off_minus1_seqs,
                    )

                print(
                    f"{current_id}\t{min_mm_gg}\t{min_mm_ag}\t{seq}\t{chrom}\t{start}\t{end}\t{strand}\tNA\t{args.pam_label}\t{s_class}"
                )


if __name__ == "__main__":
    main()
