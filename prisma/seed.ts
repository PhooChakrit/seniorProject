import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.genomeConfig.upsert({
    where: { key: 'oryza' },
    update: {},
    create: {
      key: 'oryza',
      label: 'oryza',
      description:
        'Premium Thai jasmine rice cultivar - IRGSP-1.0 reference genome with complete annotations including genes, regulatory regions, and structural variants',
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
      tracks: [
        {
          type: 'FeatureTrack',
          trackId: 'oryza_gff3_track',
          name: 'Oryza DNA Annotations',
          assemblyNames: ['Oryza_sativa'],
          category: ['Annotations'],
          adapter: {
            type: 'Gff3Adapter',
            gffLocation: {
              uri: '/genomes/oryza/Oryza_DNA.gff3',
              locationType: 'UriLocation',
            },
          },
        },
      ],
      defaultSession: {
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
      },
      defaultLocation: '1:2000-20000',
      assemblyName: 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)',
      cultivarType: 'Jasmine Rice (Premium Aromatic)',
      tracksLoaded: 'Reference Sequence + Gene Annotations (GFF3)',
      defaultRegion: 'Chromosome 1: 2,000-20,000 bp',
      specialFeatures: 'Aroma genes, Amylose content markers',
    },
  });

  await prisma.genomeConfig.upsert({
    where: { key: 'human' },
    update: {},
    create: {
      key: 'human',
      label: 'human',
      description:
        'High-yielding Thai rice variety - Comprehensive genome assembly with QTL mapping for drought tolerance and disease resistance traits',
      assemblyConfig: {
        name: 'GRCh38',
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: 'GRCh38-ReferenceSequenceTrack',
          adapter: {
            type: 'BgzipFastaAdapter',
            fastaLocation: {
              uri: 'https://jbrowse.org/genomes/GRCh38/fasta/GRCh38.fa.gz',
              locationType: 'UriLocation',
            },
            faiLocation: {
              uri: 'https://jbrowse.org/genomes/GRCh38/fasta/GRCh38.fa.gz.fai',
              locationType: 'UriLocation',
            },
            gziLocation: {
              uri: 'https://jbrowse.org/genomes/GRCh38/fasta/GRCh38.fa.gz.gzi',
              locationType: 'UriLocation',
            },
          },
        },
        aliases: ['hg38'],
        refNameAliases: {
          adapter: {
            type: 'RefNameAliasAdapter',
            location: {
              uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/hg38_aliases.txt',
              locationType: 'UriLocation',
            },
          },
        },
      },
      tracks: [
        {
          type: 'FeatureTrack',
          trackId: 'ncbi_refseq_109_hg38',
          name: 'NCBI RefSeq Genes',
          assemblyNames: ['GRCh38'],
          category: ['Genes'],
          adapter: {
            type: 'Gff3TabixAdapter',
            gffGzLocation: {
              uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/ncbi_refseq/GCA_000001405.15_GRCh38_full_analysis_set.refseq_annotation.sorted.gff.gz',
              locationType: 'UriLocation',
            },
            index: {
              location: {
                uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/ncbi_refseq/GCA_000001405.15_GRCh38_full_analysis_set.refseq_annotation.sorted.gff.gz.tbi',
                locationType: 'UriLocation',
              },
            },
          },
        },
      ],
      defaultSession: {
        name: 'My session',
        view: {
          id: 'linearGenomeView',
          type: 'LinearGenomeView',
          tracks: [
            {
              type: 'ReferenceSequenceTrack',
              configuration: 'GRCh38-ReferenceSequenceTrack',
              displays: [
                {
                  type: 'LinearReferenceSequenceDisplay',
                  configuration:
                    'GRCh38-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
                },
              ],
            },
          ],
        },
      },
      defaultLocation: 'chr1:1-100,000',
      assemblyName: 'สุพรรณบุรี 1 (Suphan Buri 1)',
      cultivarType: 'Field Rice (High-Yield Variety)',
      tracksLoaded: 'Reference Sequence + QTL Markers',
      defaultRegion: 'Chromosome 3: 5,000-25,000 bp',
      specialFeatures: 'Drought tolerance, Disease resistance QTLs',
    },
  });

  console.log('Seeded GenomeConfig: oryza, human');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
