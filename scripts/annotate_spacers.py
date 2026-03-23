#!/usr/bin/env python3
"""
annotate_spacers.py - GFF3-based Spacer Annotation

Maps CRISPR spacer coordinates to genomic features:
- Exon: Within coding exon
- Intron: Between exons of same gene
- Intergenic: Not within any gene

Input:
  1. Spacer TSV (must have Chr, cut_start, cut_end columns)
  2. GFF3 annotation file

Output:
  TSV with added 'location' and 'gene_id' columns
"""

import sys
import argparse
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

# Type aliases
Interval = Tuple[int, int]  # (start, end)
FeatureInfo = Tuple[str, str, List[Interval]]  # (gene_id, gene_name, exon_intervals)


def parse_gff3(gff_file: str) -> Dict[str, List[FeatureInfo]]:
    """
    Parse GFF3 file and extract gene/exon features.
    Returns: {chr: [(gene_id, gene_name, [(exon_start, exon_end), ...]), ...]}
    """
    genes: Dict[str, Dict[str, dict]] = defaultdict(dict)  # chr -> gene_id -> info
    
    with open(gff_file) as f:
        for line in f:
            if line.startswith('#'):
                continue
            parts = line.strip().split('\t')
            if len(parts) < 9:
                continue
            
            chrom, source, feature_type, start, end, score, strand, phase, attributes = parts
            start, end = int(start), int(end)
            
            # Parse attributes
            attr_dict = {}
            for attr in attributes.split(';'):
                if '=' in attr:
                    key, value = attr.split('=', 1)
                    attr_dict[key] = value
            
            if feature_type == 'gene':
                gene_id = attr_dict.get('ID', attr_dict.get('gene_id', ''))
                gene_name = attr_dict.get('Name', gene_id)
                if gene_id:
                    genes[chrom][gene_id] = {
                        'name': gene_name,
                        'start': start,
                        'end': end,
                        'strand': strand,
                        'exons': []
                    }
            
            elif feature_type in ('exon', 'CDS'):
                # Find parent gene
                parent = attr_dict.get('Parent', '')
                # Handle mRNA parent - need to map back to gene
                # For simplicity, we'll use direct exon-gene mapping based on coordinates
                for gene_id, gene_info in genes[chrom].items():
                    if gene_info['start'] <= start <= gene_info['end']:
                        gene_info['exons'].append((start, end))
                        break
    
    # Convert to sorted list format
    result: Dict[str, List[FeatureInfo]] = defaultdict(list)
    for chrom, gene_dict in genes.items():
        for gene_id, info in gene_dict.items():
            # Sort and merge overlapping exons
            exons = sorted(info['exons'])
            merged_exons = []
            for exon in exons:
                if merged_exons and exon[0] <= merged_exons[-1][1] + 1:
                    merged_exons[-1] = (merged_exons[-1][0], max(merged_exons[-1][1], exon[1]))
                else:
                    merged_exons.append(exon)
            
            result[chrom].append((
                gene_id,
                info['name'],
                merged_exons,
                info['start'],
                info['end']
            ))
    
    # Sort genes by start position for each chromosome
    for chrom in result:
        result[chrom].sort(key=lambda x: x[3])  # Sort by gene start
    
    return result


def find_location(chrom: str, pos_start: int, pos_end: int, 
                  gene_data: Dict[str, List]) -> Tuple[str, str]:
    """
    Determine if position falls in Exon, Intron, or Intergenic region.
    Returns: (location_type, gene_id)
    """
    if chrom not in gene_data:
        return ('Intergenic', '')
    
    # Use the midpoint of the spacer for classification
    pos = (pos_start + pos_end) // 2
    
    for gene_id, gene_name, exons, gene_start, gene_end in gene_data[chrom]:
        # Check if within gene boundaries
        if gene_start <= pos <= gene_end:
            # Check if within any exon
            for exon_start, exon_end in exons:
                if exon_start <= pos <= exon_end:
                    return ('Exon', gene_id)
            
            # Within gene but not in exon = Intron
            if exons:  # Has exons defined
                return ('Intron', gene_id)
            else:
                # Gene but no exons annotated - treat as within gene
                return ('Gene', gene_id)
    
    return ('Intergenic', '')


def annotate_spacers(spacer_file: str, gff_file: str, output_file: str):
    """
    Main annotation function.
    """
    print(f"Loading GFF3 annotations from {gff_file}...")
    gene_data = parse_gff3(gff_file)
    
    gene_count = sum(len(genes) for genes in gene_data.values())
    print(f"Loaded {gene_count} genes across {len(gene_data)} chromosomes")
    
    print(f"Annotating spacers from {spacer_file}...")
    
    # Stats
    stats = defaultdict(int)
    
    with open(spacer_file) as f_in, open(output_file, 'w') as f_out:
        header = f_in.readline().strip()
        
        # Find column indices
        cols = header.split('\t')
        cols_lower = [c.lower() for c in cols]
        try:
            chr_idx = cols.index('Chr')
            start_idx = cols.index('cut_start')
            end_idx = cols.index('cut_end')
        except ValueError as e:
            # Try alternative column names
            try:
                chr_idx = next(i for i, c in enumerate(cols) if 'chr' in c.lower())
                start_idx = next(i for i, c in enumerate(cols) if 'start' in c.lower())
                end_idx = next(i for i, c in enumerate(cols) if 'end' in c.lower())
            except StopIteration:
                print(f"Error: Required columns not found. Available: {cols}")
                print("Need: Chr, cut_start, cut_end (or similar)")
                sys.exit(1)

        # Reuse existing columns if present to preserve downstream parser positions
        location_idx: Optional[int] = None
        gene_id_idx: Optional[int] = None
        if 'location' in cols_lower:
            location_idx = cols_lower.index('location')
        if 'gene_id' in cols_lower:
            gene_id_idx = cols_lower.index('gene_id')

        # Add missing output columns
        if location_idx is None:
            cols.append('location')
            location_idx = len(cols) - 1
        if gene_id_idx is None:
            cols.append('gene_id')
            gene_id_idx = len(cols) - 1
        
        # Write normalized header
        f_out.write('\t'.join(cols) + '\n')
        
        line_count = 0
        for line in f_in:
            parts = line.strip().split('\t')
            if len(parts) <= max(chr_idx, start_idx, end_idx):
                continue

            # Ensure row has enough columns for writing location/gene_id in place
            if len(parts) < len(cols):
                parts.extend([''] * (len(cols) - len(parts)))
            
            chrom = parts[chr_idx]
            try:
                start = int(parts[start_idx])
                end = int(parts[end_idx])
            except ValueError:
                # Skip header-like rows
                continue
            
            location, gene_id = find_location(chrom, start, end, gene_data)
            stats[location] += 1
            
            parts[location_idx] = location
            parts[gene_id_idx] = gene_id
            f_out.write('\t'.join(parts[:len(cols)]) + '\n')
            line_count += 1
            
            if line_count % 100000 == 0:
                print(f"  Processed {line_count:,} spacers...")
    
    print(f"\nAnnotation complete!")
    print(f"Total spacers: {line_count:,}")
    print(f"\nLocation distribution:")
    for loc, count in sorted(stats.items()):
        pct = 100 * count / line_count if line_count > 0 else 0
        print(f"  {loc}: {count:,} ({pct:.1f}%)")
    
    print(f"\nOutput written to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Annotate CRISPR spacers with genomic location using GFF3'
    )
    parser.add_argument('spacer_tsv', help='Input spacer TSV file')
    parser.add_argument('gff3_file', help='GFF3 annotation file')
    parser.add_argument('-o', '--output', help='Output TSV file', 
                        default='spacers_annotated.tsv')
    
    args = parser.parse_args()
    
    annotate_spacers(args.spacer_tsv, args.gff3_file, args.output)


if __name__ == '__main__':
    main()
