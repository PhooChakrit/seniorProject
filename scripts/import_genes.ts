import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface GeneRecord {
  species: string;
  geneId: string;
  symbol?: string;
  chromosome: string;
  startPos: number;
  endPos: number;
  strand: string;
  description?: string;
}

async function importGenesFromGFF(filePath: string, species: string): Promise<void> {
  console.log(`Importing genes from ${filePath} for species ${species}...`);
  // Note: This is a simplified GFF3 parser for demonstration
  // In production, use a dedicated GFF parser library
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const genes: GeneRecord[] = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (!line.trim() || line.startsWith('#')) continue;

    const fields = line.split('\t');
    if (fields.length < 9) continue;

    const type = fields[2];
    if (type !== 'gene' && type !== 'mRNA') continue;

    const attributes = fields[8];
    const attrMap: Record<string, string> = {};
    attributes.split(';').forEach(attr => {
      const [key, value] = attr.split('=');
      if (key && value) attrMap[key] = value;
    });

    const geneId = attrMap['ID'] || attrMap['Name'] || `gene_${lineNumber}`;
    
    genes.push({
      species,
      geneId,
      symbol: attrMap['Name'], // Often Name is used as symbol
      chromosome: fields[0],
      startPos: parseInt(fields[3]),
      endPos: parseInt(fields[4]),
      strand: fields[6],
      description: attrMap['Note'] || attrMap['description']
    });

    if (genes.length >= 1000) {
      // Use upsert or skip duplicates logic if needed, here we use createMany with skipDuplicates for simplicity if supported,
      // but createMany doesn't support skipDuplicates locally easily without unique constraint error handling in loop.
      // So we'll try createMany and catch error (or assume clean DB).
      // For safety in this script, let's use loop for upsert in real world, but for bulk speed createMany is better.
      // Since we defined @@unique([species, geneId]), createMany will fail on duplicates.
      // We will skipDuplicates in createMany
      await prisma.gene.createMany({ 
        data: genes,
        skipDuplicates: true 
      });
      console.log(`Processed ${lineNumber} lines...`);
      genes.length = 0;
    }
  }

  if (genes.length > 0) {
    await prisma.gene.createMany({ 
      data: genes,
      skipDuplicates: true
    });
  }

  console.log('Import complete!');
}

async function generateSampleGenes(species: string, count: number = 50): Promise<void> {
  console.log(`Generating ${count} sample genes for ${species}...`);

  const sampleGenes: GeneRecord[] = [];
  
  for (let i = 1; i <= count; i++) {
    const chrNum = Math.floor(Math.random() * 12) + 1;
    const chromosome = `Chr${chrNum.toString().padStart(2, '0')}`;
    const startPos = Math.floor(Math.random() * 900000) + 10000;
    const length = Math.floor(Math.random() * 5000) + 500;
    
    // Generate valid ID format based on species
    let geneId = '';
    if (species.includes('oryza')) {
        // Format: Os01g01000
        geneId = `Os${chrNum.toString().padStart(2, '0')}g${(i * 100).toString().padStart(5, '0')}`;
    } else {
        geneId = `Gene_${i}`;
    }

    sampleGenes.push({
      species,
      geneId,
      symbol: `Sym${i}`,
      chromosome,
      startPos,
      endPos: startPos + length,
      strand: Math.random() > 0.5 ? '+' : '-',
      description: `Sample gene description for ${geneId}`
    });
  }

  await prisma.gene.createMany({ 
    data: sampleGenes,
    skipDuplicates: true 
  });
  
  console.log(`Generated ${count} sample genes!`);
  // Also log some IDs for the user to try
  console.log('Try searching for these IDs:', sampleGenes.slice(0, 5).map(g => g.geneId).join(', '));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'sample') {
    const count = parseInt(args[1], 10) || 50;
    const species = args[2] || 'oryza_sativa';
    await generateSampleGenes(species, count);
  } else if (command === 'clear') {
    await prisma.gene.deleteMany();
    console.log('Cleared all genes');
  } else if (command === 'list') {
      const genes = await prisma.gene.findMany({ take: 20 });
      console.table(genes);
  } else {
    console.log('Usage: npx ts-node scripts/import_genes.ts [sample|clear|list]');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
