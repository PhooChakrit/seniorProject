import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cleanup legacy demo configs that do not map to genomes/<folder>/genome.json ids
  await prisma.genomeConfig.deleteMany({
    where: {
      key: {
        in: ['human'],
      },
    },
  });

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

  await prisma.genomeConfig.upsert({
    where: { key: 'kdml105' },
    update: {
      key: 'kdml105',
      label: 'KDML105 (ข้าวหอมมะลิ)',
      description:
        'Thai jasmine rice cultivar (KDML105) with local reference and annotations from genomes/KDML',
      defaultLocation: 'ptg000001l:2000-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence + Gene Annotations (GFF3 Tabix)',
      defaultRegion: 'ptg000001l: 2,000-20,000 bp',
      specialFeatures: 'Aroma genes, Amylose content markers',
      tracks: kdml105Tracks,
      defaultSession: kdml105DefaultSession,
    },
    create: {
      key: 'kdml105',
      label: 'KDML105 (ข้าวหอมมะลิ)',
      description:
        'Thai jasmine rice cultivar (KDML105) with local reference and annotations from genomes/KDML',
      assemblyConfig: {
        name: 'KDML105',
        aliases: ['KDML'],
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: 'KDML105-ReferenceSequenceTrack',
          adapter: {
            type: 'IndexedFastaAdapter',
            fastaLocation: {
              uri: '/genomes/KDML/KDML105.fasta',
              locationType: 'UriLocation',
            },
            faiLocation: {
              uri: '/genomes/KDML/KDML105.fasta.fai',
              locationType: 'UriLocation',
            },
          },
        },
      },
      tracks: kdml105Tracks,
      defaultSession: kdml105DefaultSession,
      defaultLocation: 'ptg000001l:2000-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence + Gene Annotations (GFF3 Tabix)',
      defaultRegion: 'ptg000001l: 2,000-20,000 bp',
      specialFeatures: 'Aroma genes, Amylose content markers',
    },
  });
  const oryzaTracks = [
    {
      type: 'FeatureTrack',
      trackId: 'oryza_gff3_track',
      name: 'Oryza DNA Annotations',
      assemblyNames: ['Oryza_sativa'],
      category: ['Annotations'],
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: '/genomes/oryza/Oryza_DNA.sorted.gff3.gz',
          locationType: 'UriLocation',
        },
        index: {
          location: {
            uri: '/genomes/oryza/Oryza_DNA.sorted.gff3.gz.tbi',
            locationType: 'UriLocation',
          },
        },
      },
    },
  ];
  const oryzaDefaultSession = {
    name: 'Oryza Session',
    view: {
      id: 'linearGenomeView',
      type: 'LinearGenomeView',
      tracks: [
        {
          type: 'ReferenceSequenceTrack',
          configuration: 'Oryza-ReferenceSequenceTrack',
          displays: [
            {
              type: 'LinearReferenceSequenceDisplay',
              configuration:
                'Oryza-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
            },
          ],
        },
        {
          type: 'FeatureTrack',
          configuration: 'oryza_gff3_track',
          displays: [
            {
              type: 'LinearBasicDisplay',
              configuration: 'oryza_gff3_track-LinearBasicDisplay',
            },
          ],
        },
      ],
    },
  };

  await prisma.genomeConfig.upsert({
    where: { key: 'oryza' },
    update: {
      key: 'oryza',
      label: 'Oryza (Rice)',
      description:
        'IRGSP-1.0 rice reference genome with Oryza annotations',
      defaultLocation: '1:2000-20000',
      assemblyName: 'Oryza_sativa (IRGSP-1.0)',
      cultivarType: 'Reference Rice Genome',
      tracksLoaded: 'Reference Sequence + Oryza DNA GFF3 (Tabix)',
      defaultRegion: 'Chromosome 1: 2,000-20,000 bp',
      specialFeatures: 'Reference assembly for comparative viewing',
      tracks: oryzaTracks,
      defaultSession: oryzaDefaultSession,
    },
    create: {
      key: 'oryza',
      label: 'Oryza (Rice)',
      description:
        'IRGSP-1.0 rice reference genome with Oryza annotations',
      assemblyConfig: {
        name: 'Oryza_sativa',
        aliases: ['IRGSP-1.0'],
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: 'Oryza-ReferenceSequenceTrack',
          adapter: {
            type: 'IndexedFastaAdapter',
            fastaLocation: {
              uri: '/genomes/oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa',
              locationType: 'UriLocation',
            },
            faiLocation: {
              uri: '/genomes/oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa.fai',
              locationType: 'UriLocation',
            },
          },
        },
      },
      tracks: oryzaTracks,
      defaultSession: oryzaDefaultSession,
      defaultLocation: '1:2000-20000',
      assemblyName: 'Oryza_sativa (IRGSP-1.0)',
      cultivarType: 'Reference Rice Genome',
      tracksLoaded: 'Reference Sequence + Oryza DNA GFF3 (Tabix)',
      defaultRegion: 'Chromosome 1: 2,000-20,000 bp',
      specialFeatures: 'Reference assembly for comparative viewing',
    },
  });
  console.log('Seeded GenomeConfig: kdml105, oryza');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
