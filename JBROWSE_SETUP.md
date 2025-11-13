# How to Add Your Oryza_DNA.gff3 File to JBrowse

## Quick Steps

### 1. Prepare Your GFF3 File

Your GFF3 file needs to be sorted, compressed, and indexed for JBrowse to use it efficiently.

**Install required tools** (if not already installed):
```bash
# On macOS
brew install htslib

# On Ubuntu/Debian
sudo apt-get install tabix
```

**Prepare the file:**
```bash
# Navigate to where your Oryza_DNA.gff3 file is located
cd /path/to/your/file

# 1. Sort the GFF3 file
sort -k1,1 -k4,4n Oryza_DNA.gff3 > Oryza_DNA.sorted.gff3

# 2. Compress with bgzip
bgzip Oryza_DNA.sorted.gff3

# 3. Index with tabix
tabix -p gff Oryza_DNA.sorted.gff3.gz
```

This creates two files:
- `Oryza_DNA.sorted.gff3.gz` (compressed GFF3)
- `Oryza_DNA.sorted.gff3.gz.tbi` (index)

### 2. Copy Files to the Project

```bash
# Copy both files to the public/genomes/oryza directory
cp Oryza_DNA.sorted.gff3.gz public/genomes/oryza/
cp Oryza_DNA.sorted.gff3.gz.tbi public/genomes/oryza/
```

### 3. (Optional) Add Reference Genome

If you have a FASTA reference genome file:

```bash
# Copy your reference FASTA
cp reference.fa public/genomes/oryza/

# Create FASTA index
samtools faidx public/genomes/oryza/reference.fa
```

### 4. View in JBrowse

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Navigate to the JBrowse page in your browser:
   ```
   http://localhost:5173/jbrowse
   ```

3. Click the **"Oryza (Rice)"** button to view your Oryza genome

4. Use the search box or navigation controls to explore your annotations

## Troubleshooting

### If the GFF3 track doesn't load:

1. **Check the browser console** for errors (F12 or Cmd+Option+I)
2. **Verify files are in the correct location:**
   ```bash
   ls -la public/genomes/oryza/
   ```
   You should see:
   - `Oryza_DNA.sorted.gff3.gz`
   - `Oryza_DNA.sorted.gff3.gz.tbi`

3. **Check chromosome names** in your GFF3:
   ```bash
   zcat public/genomes/oryza/Oryza_DNA.sorted.gff3.gz | head -20
   ```
   
   Update the `location` in `JBrowsePage.tsx` to match your chromosome names.
   For example, if your chromosomes are named "Chr1", "Chr2", etc., change:
   ```tsx
   location: '1:1-100,000'  // to
   location: 'Chr1:1-100,000'
   ```

### If you don't have a reference genome:

You can still view the GFF3 annotations! Just remove the ReferenceSequenceTrack from the session in `JBrowsePage.tsx`.

## File Structure

After setup, your directory should look like:

```
public/
  genomes/
    oryza/
      Oryza_DNA.sorted.gff3.gz
      Oryza_DNA.sorted.gff3.gz.tbi
      reference.fa (optional)
      reference.fa.fai (optional)
```

## Alternative: Use Unsorted GFF3 (Slower)

If you don't want to compress/index, you can use the raw GFF3:

Update `oryzaTracks` in `JBrowsePage.tsx`:
```tsx
adapter: {
  type: 'Gff3Adapter',  // Instead of Gff3TabixAdapter
  gffLocation: {
    uri: '/genomes/oryza/Oryza_DNA.gff3',
    locationType: 'UriLocation',
  },
},
```

Then just copy the raw file:
```bash
cp Oryza_DNA.gff3 public/genomes/oryza/
```

**Note:** This will be slower for large files.
