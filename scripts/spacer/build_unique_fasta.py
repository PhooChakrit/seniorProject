#!/usr/bin/env python3
"""Deduplicate FASTA by sequence; keep first header per unique sequence."""

from __future__ import annotations

import argparse
from collections import OrderedDict
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--work-dir",
        type=Path,
        default=Path("."),
        help="Directory containing {prefix}_candidates.fa",
    )
    p.add_argument(
        "--prefix",
        choices=("NGG", "NAG"),
        required=True,
        help="Reads {prefix}_candidates.fa, writes {prefix}_unique.fa",
    )
    args = p.parse_args()
    work = args.work_dir.resolve()
    input_fasta = work / f"{args.prefix}_candidates.fa"
    output_fasta = work / f"{args.prefix}_unique.fa"

    seq_to_first_id: OrderedDict[str, str] = OrderedDict()
    current_id = ""
    seq_chunks: list[str] = []

    def flush_record() -> None:
        nonlocal current_id, seq_chunks
        if not current_id:
            return
        seq = "".join(seq_chunks).strip()
        if seq and seq not in seq_to_first_id:
            seq_to_first_id[seq] = current_id
        current_id = ""
        seq_chunks = []

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
    print(f"[{args.prefix}] Wrote {len(seq_to_first_id)} unique -> {output_fasta}")


if __name__ == "__main__":
    main()
