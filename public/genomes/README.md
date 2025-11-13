# Genome Files

Place your genome data files here for JBrowse visualization.

## Directory Structure

```
genomes/
  oryza/
    Oryza_DNA.gff3          # Your GFF3 annotation file
    reference.fa            # FASTA reference sequence (optional)
    reference.fa.fai        # FASTA index (if using FASTA)
```

## Adding Your Files

1. Copy your `Oryza_DNA.gff3` file to the `genomes/oryza/` directory
2. If you have a reference genome FASTA file, add it here too
3. The files will be served at `/genomes/oryza/Oryza_DNA.gff3`

## Preparing GFF3 Files for JBrowse

For best performance with JBrowse, you should:

1. **Sort your GFF3 file:**
   ```bash
   sort -k1,1 -k4,4n Oryza_DNA.gff3 > Oryza_DNA.sorted.gff3
   ```

2. **Compress and index it:**
   ```bash
   bgzip Oryza_DNA.sorted.gff3
   tabix -p gff Oryza_DNA.sorted.gff3.gz
   ```

This creates:
- `Oryza_DNA.sorted.gff3.gz` - compressed file
- `Oryza_DNA.sorted.gff3.gz.tbi` - tabix index

Both files should be placed in the `genomes/oryza/` directory.
