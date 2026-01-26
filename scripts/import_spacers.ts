import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface SpacerRecord {
  species: string;
  chromosome: string;
  startPos: number;
  endPos: number;
  strand: string;
  spacerSeq: string;
  pam: string;
  location?: string;
  minMM_GG?: string;
  minMM_AG?: string;
  spacerClass?: string;
}

async function importSpacersFromTSV(filePath: string, species: string): Promise<void> {
  console.log(`Importing spacers from ${filePath} for species ${species}...`);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const spacers: SpacerRecord[] = [];
  let lineNumber = 0;
  let headerParsed = false;
  let headers: string[] = [];

  for await (const line of rl) {
    lineNumber++;

    // Skip empty lines
    if (!line.trim()) continue;

    const fields = line.split('\t');

    // Parse header
    if (!headerParsed) {
      headers = fields.map((h) => h.toLowerCase().trim());
      headerParsed = true;
      console.log('Headers found:', headers);
      continue;
    }

    try {
      // Parse SeqID (format: Chr1:18138330-18138349:rc or Chr1:18138330-18138349)
      const seqIdField = fields[0] || '';
      const seqIdMatch = seqIdField.match(/^(?:Chr)?(\d+):(\d+)-(\d+):?(rc)?$/i);

      if (!seqIdMatch) {
        console.warn(`Line ${lineNumber}: Could not parse SeqID: ${seqIdField}`);
        continue;
      }

      const chromosome = seqIdMatch[1];
      const startPos = parseInt(seqIdMatch[2], 10);
      const endPos = parseInt(seqIdMatch[3], 10);
      const strand = seqIdMatch[4] === 'rc' ? '-' : '+';

      // Get other fields by header name or position
      const getField = (name: string, defaultIndex: number): string => {
        const idx = headers.indexOf(name.toLowerCase());
        return idx >= 0 ? fields[idx] || '' : fields[defaultIndex] || '';
      };

      const spacer: SpacerRecord = {
        species,
        chromosome,
        startPos,
        endPos,
        strand,
        spacerSeq: getField('spacer seq (5\'->3\')', 3) || getField('seq', 3),
        pam: getField('pam (5\'->3\')', 4) || getField('pam', 4),
        minMM_GG: getField('minmm_gg', 1) || undefined,
        minMM_AG: getField('minmm_ag', 2) || undefined,
        location: getField('location', 6) || undefined,
        spacerClass: getField('class', 7) || undefined,
      };

      spacers.push(spacer);

      // Batch insert every 1000 records
      if (spacers.length >= 1000) {
        await prisma.spacer.createMany({ data: spacers });
        console.log(`Inserted ${lineNumber - 1} records...`);
        spacers.length = 0;
      }
    } catch (error) {
      console.error(`Line ${lineNumber}: Error parsing line:`, error);
    }
  }

  // Insert remaining records
  if (spacers.length > 0) {
    await prisma.spacer.createMany({ data: spacers });
  }

  console.log(`Import complete! Total lines processed: ${lineNumber - 1}`);
}

async function generateSampleData(species: string, count: number = 100): Promise<void> {
  console.log(`Generating ${count} sample spacers for ${species}...`);

  const sampleSpacers: SpacerRecord[] = [];
  const locations = ['exon', 'intron', "5'utr", "3'utr", 'promoter'];
  const classes = ['A0', 'B0', 'B1', 'B2', 'A1', 'A2'];
  const bases = ['A', 'T', 'G', 'C'];

  const randomSeq = (len: number): string => {
    return Array.from({ length: len }, () => bases[Math.floor(Math.random() * 4)]).join('');
  };

  for (let i = 0; i < count; i++) {
    // Use "Chr01", "Chr02" format to match species.json
    const chrNum = Math.floor(Math.random() * 12) + 1;
    const chromosome = `Chr${chrNum.toString().padStart(2, '0')}`;
    // Generate positions in testable range (e.g., 10000-1000000)
    const startPos = Math.floor(Math.random() * 990000) + 10000;
    const endPos = startPos + 19;

    sampleSpacers.push({
      species,
      chromosome,
      startPos,
      endPos,
      strand: Math.random() > 0.5 ? '+' : '-',
      spacerSeq: randomSeq(20),
      pam: randomSeq(3) + 'GG' + randomSeq(5),
      minMM_GG: Math.random() > 0.3 ? '4+' : String(Math.floor(Math.random() * 4)),
      minMM_AG: Math.random() > 0.3 ? '4+' : String(Math.floor(Math.random() * 4)),
      location: locations[Math.floor(Math.random() * locations.length)],
      spacerClass: classes[Math.floor(Math.random() * classes.length)],
    });
  }

  await prisma.spacer.createMany({ data: sampleSpacers });
  console.log(`Generated ${count} sample spacers!`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'import') {
    const filePath = args[1];
    const species = args[2] || 'oryza_sativa';

    if (!filePath) {
      console.error('Usage: npx ts-node scripts/import_spacers.ts import <file.tsv> [species]');
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    await importSpacersFromTSV(filePath, species);
  } else if (command === 'sample') {
    const count = parseInt(args[1], 10) || 100;
    const species = args[2] || 'oryza_sativa';
    await generateSampleData(species, count);
  } else if (command === 'clear') {
    const species = args[1];
    if (species) {
      const result = await prisma.spacer.deleteMany({ where: { species } });
      console.log(`Deleted ${result.count} spacers for species ${species}`);
    } else {
      const result = await prisma.spacer.deleteMany();
      console.log(`Deleted ${result.count} spacers`);
    }
  } else if (command === 'count') {
    const count = await prisma.spacer.count();
    console.log(`Total spacers in database: ${count}`);
  } else {
    console.log('Usage:');
    console.log('  npx ts-node scripts/import_spacers.ts import <file.tsv> [species]');
    console.log('  npx ts-node scripts/import_spacers.ts sample [count] [species]');
    console.log('  npx ts-node scripts/import_spacers.ts clear [species]');
    console.log('  npx ts-node scripts/import_spacers.ts count');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
