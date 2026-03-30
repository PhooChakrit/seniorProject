"""Resolve genomes/<cultivar>/genome.json — one folder for JBrowse + spacer analysis."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def default_genomes_base() -> Path:
    return repo_root() / "genomes"


def load_manifest(genome_dir: Path) -> dict[str, Any]:
    path = genome_dir / "genome.json"
    if not path.is_file():
        raise FileNotFoundError(f"Missing genome manifest: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_genome_dir(genomes_base: Path, key: str) -> Path:
    """
    key = folder name (e.g. KDML) or manifest id (e.g. kdml105).
    """
    genomes_base = genomes_base.resolve()
    direct = genomes_base / key
    if direct.is_dir() and (direct / "genome.json").is_file():
        return direct
    key_lower = key.lower()
    for sub in sorted(genomes_base.iterdir()):
        if not sub.is_dir() or sub.name.startswith("."):
            continue
        mf = sub / "genome.json"
        if not mf.is_file():
            continue
        try:
            data = json.loads(mf.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if str(data.get("id", "")).lower() == key_lower:
            return sub
    raise FileNotFoundError(
        f"No genome folder under {genomes_base} for key {key!r} "
        f"(use folder name or genome.json id)"
    )


def fasta_path(genome_dir: Path, manifest: dict[str, Any]) -> Path:
    rel = manifest.get("fasta")
    if not rel:
        raise ValueError("genome.json must define 'fasta'")
    return (genome_dir / rel).resolve()


def gff3_path(genome_dir: Path, manifest: dict[str, Any]) -> Path:
    rel = manifest.get("gff3")
    if not rel:
        raise ValueError("genome.json must define 'gff3'")
    return (genome_dir / rel).resolve()
