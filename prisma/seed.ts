import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cleanup legacy demo configs that do not map to genomes/<folder>/genome.json ids
  await prisma.genomeConfig.deleteMany({
    where: {
      key: {
        in: ['oryza', 'human'],
      },
    },
  });

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
      tracksLoaded: 'Reference Sequence + Gene Annotations (GFF3)',
      defaultRegion: 'ptg000001l: 2,000-20,000 bp',
      specialFeatures: 'Aroma genes, Amylose content markers',
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
      tracks: [
        {
          type: 'FeatureTrack',
          trackId: 'kdml105_gff3_track',
          name: 'KDML105 Gene Annotations',
          assemblyNames: ['KDML105'],
          category: ['Annotations'],
          adapter: {
            type: 'Gff3Adapter',
            gffLocation: {
              uri: '/genomes/KDML/KDML105.gff3',
              locationType: 'UriLocation',
            },
          },
        },
      ],
      defaultSession: {
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
      },
      defaultLocation: 'ptg000001l:2000-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence + Gene Annotations (GFF3)',
      defaultRegion: 'ptg000001l: 2,000-20,000 bp',
      specialFeatures: 'Aroma genes, Amylose content markers',
    },
  });
  console.log('Seeded GenomeConfig: kdml105');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
