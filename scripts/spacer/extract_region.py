#!/usr/bin/env python3
"""Extract a genomic region from a FASTA (full genome or single entry)."""

from __future__ import annotations

import argparse
from pathlib import Path

from Bio import SeqIO
from Bio.SeqRecord import SeqRecord

from genome_paths import default_genomes_base, fasta_path, load_manifest, resolve_genome_dir


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument(
        "--genome",
        metavar="KEY",
        help="Cultivar folder name (e.g. KDML) or genome.json id (e.g. kdml105)",
    )
    src.add_argument("--input", type=Path, help="Path to reference FASTA")
    p.add_argument(
        "--genomes-dir",
        type=Path,
        default=None,
        help="Default: <repo>/genomes",
    )
    p.add_argument("--contig", required=True, help="FASTA record id")
    p.add_argument("--start", type=int, required=True, help="1-based start")
    p.add_argument("--end", type=int, required=True, help="1-based end inclusive")
    p.add_argument(
        "--output",
        type=Path,
        default=Path("REGION.fna"),
        help="Output FASTA path (default: ./REGION.fna)",
    )
    args = p.parse_args()

    if args.genome:
        base = args.genomes_dir or default_genomes_base()
        gdir = resolve_genome_dir(base, args.genome)
        manifest = load_manifest(gdir)
        input_file = fasta_path(gdir, manifest)
    else:
        input_file = args.input.resolve()

    if not input_file.is_file():
        raise SystemExit(f"FASTA not found: {input_file}")

    print("Loading genome from %s..." % input_file)
    target_record = None
    for rec in SeqIO.parse(str(input_file), "fasta"):
        if rec.id == args.contig:
            target_record = rec
            break

    if target_record is None:
        raise SystemExit("Contig %r not found in %s" % (args.contig, input_file))

    print("Target contig: %s" % target_record.id)
    print("Contig length: %d" % len(target_record.seq))

    region_seq = target_record.seq[args.start - 1 : args.end]
    region_record = SeqRecord(
        region_seq,
        id="%s:%d-%d" % (target_record.id, args.start, args.end),
        description="",
    )

    out = args.output
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as fh:
        SeqIO.write(region_record, fh, "fasta")

    print("Extracted region: %d bp -> %s" % (len(region_seq), out))


if __name__ == "__main__":
    main()
