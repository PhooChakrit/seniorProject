import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Variety233Entry {
  sampleNo: number;
  nCode: string;
  code: string;
  gsNumber: string;
  thaiName: string;
  englishName: string;
  label: string;
}

function buildCultivarGenomeConfig(params: {
  key: string;
  code: string;
  label: string;
  description: string;
  assemblyName: string;
  cultivarType: string;
  defaultLocation: string;
  defaultRegion: string;
  specialFeatures: string;
}) {
  const {
    key,
    code,
    label,
    description,
    assemblyName,
    cultivarType,
    defaultLocation,
    defaultRegion,
    specialFeatures,
  } = params;

  const trackId = `${key}_gff3_track`;
  const refTrackId = `${code}-ReferenceSequenceTrack`;

  const assemblyConfig = {
    name: code,
    aliases: [key],
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: refTrackId,
      adapter: {
        type: 'BgzipFastaAdapter',
        fastaLocation: {
          uri: `/genomes/${code}/${code}.fa.gz`,
          locationType: 'UriLocation',
        },
        faiLocation: {
          uri: `/genomes/${code}/${code}.fa.gz.fai`,
          locationType: 'UriLocation',
        },
        gziLocation: {
          uri: `/genomes/${code}/${code}.fa.gz.gzi`,
          locationType: 'UriLocation',
        },
      },
    },
  };

  const tracks = [
    {
      type: 'FeatureTrack',
      trackId,
      name: `${code} Gene Annotations`,
      assemblyNames: [code],
      category: ['Annotations'],
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: `/genomes/${code}/${code}.sorted.gff3.gz`,
          locationType: 'UriLocation',
        },
        index: {
          location: {
            uri: `/genomes/${code}/${code}.sorted.gff3.gz.tbi`,
            locationType: 'UriLocation',
          },
        },
      },
    },
  ];

  const defaultSession = {
    name: `${code} Session`,
    view: {
      id: 'linearGenomeView',
      type: 'LinearGenomeView',
      tracks: [
        {
          type: 'ReferenceSequenceTrack',
          configuration: refTrackId,
          displays: [
            {
              type: 'LinearReferenceSequenceDisplay',
              configuration: `${refTrackId}-LinearReferenceSequenceDisplay`,
            },
          ],
        },
        {
          type: 'FeatureTrack',
          configuration: trackId,
          displays: [
            {
              type: 'LinearBasicDisplay',
              configuration: `${trackId}-LinearBasicDisplay`,
            },
          ],
        },
      ],
    },
  };

  return {
    key,
    label,
    description,
    assemblyConfig,
    tracks,
    defaultSession,
    defaultLocation,
    assemblyName,
    cultivarType,
    tracksLoaded: 'Reference Sequence (Bgzip FASTA) + Gene Annotations (GFF3 Tabix)',
    defaultRegion,
    specialFeatures,
  };
}

async function main() {
  // Reset GenomeConfig table so insertion order strictly matches:
  // 1. KDML105, 2. IRGSP-1.0, 3. AA001..IY233 (233 varieties in order)
  await prisma.genomeConfig.deleteMany({});

  // 1. KDML105 (ขาวดอกมะลิ 105) — folder: genomes/KDML, files: KDML105.fa.gz & KDML105.sorted.gff3.gz
  const kdml105Tracks = [
    {
      type: 'FeatureTrack',
      trackId: 'kdml105_gff3_track',
      name: 'KDML105 Gene Annotations',
      assemblyNames: ['KDML105'],
      category: ['Annotations'],
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: '/genomes/KDML/KDML105.sorted.gff3.gz',
          locationType: 'UriLocation',
        },
        index: {
          location: {
            uri: '/genomes/KDML/KDML105.sorted.gff3.gz.tbi',
            locationType: 'UriLocation',
          },
        },
      },
    },
  ];

  const kdml105DefaultSession = {
    name: 'KDML105 Session',
    view: {
      id: 'linearGenomeView',
      type: 'LinearGenomeView',
      tracks: [
        {
          type: 'ReferenceSequenceTrack',
          configuration: 'KDML105-ReferenceSequenceTrack',
          displays: [
            {
              type: 'LinearReferenceSequenceDisplay',
              configuration:
                'KDML105-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
            },
          ],
        },
        {
          type: 'FeatureTrack',
          configuration: 'kdml105_gff3_track',
          displays: [
            {
              type: 'LinearBasicDisplay',
              configuration: 'kdml105_gff3_track-LinearBasicDisplay',
            },
          ],
        },
      ],
    },
  };

  const kdml105AssemblyConfig = {
    name: 'KDML105',
    aliases: ['KDML'],
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: 'KDML105-ReferenceSequenceTrack',
      adapter: {
        type: 'BgzipFastaAdapter',
        fastaLocation: {
          uri: '/genomes/KDML/KDML105.fa.gz',
          locationType: 'UriLocation',
        },
        faiLocation: {
          uri: '/genomes/KDML/KDML105.fa.gz.fai',
          locationType: 'UriLocation',
        },
        gziLocation: {
          uri: '/genomes/KDML/KDML105.fa.gz.gzi',
          locationType: 'UriLocation',
        },
      },
    },
  };

  await prisma.genomeConfig.upsert({
    where: { key: 'kdml105' },
    update: {
      key: 'kdml105',
      label: 'KDML105 (ขาวดอกมะลิ 105)',
      description:
        'Thai jasmine rice cultivar (KDML105) with final merged genome annotations (40,947 genes: RAP-DB liftoff, IR64 liftoff, and MAKER). Gene IDs use the format KDML_contigname_NNNNNN (e.g. KDML_ptg000001l_000100) — use the same IDs in Analysis → Search by gene ID.',
      assemblyConfig: kdml105AssemblyConfig,
      defaultLocation: 'ptg000001l:12500-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence (Bgzip FASTA) + Gene Annotations (GFF3 Tabix)',
      defaultRegion: 'ptg000001l: ~12,500–20,000 bp (KDML_ptg000001l_000100)',
      specialFeatures: 'Aroma genes, Amylose content markers',
      tracks: kdml105Tracks,
      defaultSession: kdml105DefaultSession,
    },
    create: {
      key: 'kdml105',
      label: 'KDML105 (ขาวดอกมะลิ 105)',
      description:
        'Thai jasmine rice cultivar (KDML105) with final merged genome annotations (40,947 genes: RAP-DB liftoff, IR64 liftoff, and MAKER). Gene IDs use the format KDML_contigname_NNNNNN (e.g. KDML_ptg000001l_000100) — use the same IDs in Analysis → Search by gene ID.',
      assemblyConfig: kdml105AssemblyConfig,
      tracks: kdml105Tracks,
      defaultSession: kdml105DefaultSession,
      defaultLocation: 'ptg000001l:12500-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence (Bgzip FASTA) + Gene Annotations (GFF3 Tabix)',
      defaultRegion: 'ptg000001l: ~12,500–20,000 bp (KDML_ptg000001l_000100)',
      specialFeatures: 'Aroma genes, Amylose content markers',
    },
  });

  // 2. IRGSP-1.0 (Nipponbare) — folder: genomes/IRGSP, files: IRGSP.fa.gz & IRGSP.sorted.gff3.gz
  const irgspConfig = buildCultivarGenomeConfig({
    key: 'irgsp1',
    code: 'IRGSP',
    label: 'IRGSP-1.0 (Nipponbare)',
    description:
      'Oryza sativa Japonica Group reference genome (IRGSP-1.0 / Nipponbare, Chromosomes 1–12) with RAP-DB / Ensembl Plants gene annotations (e.g. Os01g0100100).',
    assemblyName: 'IRGSP-1.0 (Nipponbare)',
    cultivarType: 'Reference Genome (Japonica)',
    defaultLocation: '1:2500-15000',
    defaultRegion: 'Chromosome 1: 2,500–15,000 bp (Os01g0100100)',
    specialFeatures: 'Standard international rice reference assembly (Chr 1–12)',
  });

  await prisma.genomeConfig.upsert({
    where: { key: irgspConfig.key },
    update: irgspConfig,
    create: irgspConfig,
  });

  // 3. Auto-seed all installed cultivars from the 233 Thai rice varieties list
  const varietiesJsonPath = path.join(process.cwd(), 'scripts', 'varieties_233.json');
  const genomesDir = path.join(process.cwd(), 'genomes');
  const seededCultivars: string[] = ['kdml105', 'irgsp1'];

  if (fs.existsSync(varietiesJsonPath)) {
    const varieties233: Variety233Entry[] = JSON.parse(
      fs.readFileSync(varietiesJsonPath, 'utf-8')
    );

    for (const v of varieties233) {
      const manifestPath = path.join(genomesDir, v.code, 'genome.json');
      if (!fs.existsSync(manifestPath)) {
        continue;
      }

      const key = v.code.toLowerCase();
      const cfg = buildCultivarGenomeConfig({
        key,
        code: v.code,
        label: v.label,
        description: `Thai rice cultivar ${v.thaiName} (${v.englishName}, Code: ${v.code}, Sample: ${v.sampleNo}, G.S. No. ${v.gsNumber}) consensus assembly built from SNP + Indel VCF against IRGSP-1.0 with CrossMap lifted-over gene annotations (e.g. Os01g0100100).`,
        assemblyName: `${v.code} - ${v.thaiName} (${v.englishName})`,
        cultivarType: `Thai Rice Accession (G.S. No. ${v.gsNumber})`,
        defaultLocation: '1:2500-15000',
        defaultRegion: 'Chromosome 1: 2,500–15,000 bp (Os01g0100100)',
        specialFeatures: 'Bgzip FASTA (bcftools) + Indel-shifted GFF3 Tabix (CrossMap)',
      });

      await prisma.genomeConfig.upsert({
        where: { key: cfg.key },
        update: cfg,
        create: cfg,
      });

      seededCultivars.push(cfg.key);
    }
  }

  console.log(`Seeded GenomeConfig (${seededCultivars.length}): ${seededCultivars.join(', ')}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
