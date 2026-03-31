import * as fs from 'fs';
import * as path from 'path';

export interface GenomeManifest {
  id?: string;
  label?: string;
  fasta?: string;
  gff3?: string;
}

export function genomesBaseDir(): string {
  return path.join(process.cwd(), 'genomes');
}

export function parseDefaultContig(defaultLocation?: string): string {
  if (!defaultLocation) return '';
  const [contig] = defaultLocation.split(':');
  return contig?.trim() || '';
}

export function loadGenomeManifestById(genomesDir: string): Map<string, { folder: string; manifest: GenomeManifest }> {
  const byId = new Map<string, { folder: string; manifest: GenomeManifest }>();
  if (!fs.existsSync(genomesDir)) return byId;

  for (const folder of fs.readdirSync(genomesDir)) {
    if (folder.startsWith('.')) continue;
    const folderPath = path.join(genomesDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const manifestPath = path.join(folderPath, 'genome.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as GenomeManifest;
      const id = (manifest.id || '').trim();
      if (!id || byId.has(id)) continue;
      byId.set(id, { folder, manifest });
    } catch (_error) {
      console.warn(`Invalid genome manifest at ${manifestPath}`);
    }
  }

  return byId;
}

export function loadContigsFromFai(faiPath: string): string[] {
  if (!fs.existsSync(faiPath)) return [];
  const rows = fs
    .readFileSync(faiPath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return rows
    .map((line) => line.split('\t')[0]?.trim())
    .filter((contig): contig is string => Boolean(contig));
}
