import React, { useEffect, useState } from 'react';
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Oryza sativa (Rice) genome configuration
const oryzaAssembly = {
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
};

// Tracks configuration for Oryza
const oryzaTracks = [
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
            configuration: 'Oryza-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
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

// Sample genome configuration for JBrowse 2 (Human genome)
const assembly = {
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
};

const tracks = [
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
];

const defaultSession = {
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
            configuration: 'GRCh38-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
          },
        ],
      },
    ],
  },
};

export const JBrowsePage: React.FC = () => {
  const [viewState, setViewState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [useOryza, setUseOryza] = useState(true); // Default to Oryza genome

  useEffect(() => {
    try {
      const config = useOryza
        ? {
          assembly: oryzaAssembly,
          tracks: oryzaTracks,
          location: '1:2000-20000', // Chromosome 1 region with data
          defaultSession: oryzaDefaultSession,
        }
        : {
          assembly,
          tracks,
          location: 'chr1:1-100,000',
          defaultSession,
        };

      const state = createViewState(config);
      setViewState(state);
    } catch (err: any) {
      console.error('Error creating JBrowse view state:', err);
      setError(err.message || 'Failed to initialize JBrowse');
    }
  }, [useOryza]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">JBrowse 2 Genome Browser</h2>
            <p className="text-muted-foreground">
              Explore genomic data with the interactive JBrowse 2 browser
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="genome-select" className="text-base font-semibold">
              Select Genome
            </Label>
            <Select
              value={useOryza ? 'oryza' : 'human'}
              onValueChange={(value) => setUseOryza(value === 'oryza')}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a rice variety" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oryza">oryza</SelectItem>
                <SelectItem value="human">human</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {useOryza ? 'oryza' : 'human'}
            </CardTitle>
            <CardDescription>
              {useOryza
                ? 'Premium Thai jasmine rice cultivar - IRGSP-1.0 reference genome with complete annotations including genes, regulatory regions, and structural variants'
                : 'High-yielding Thai rice variety - Comprehensive genome assembly with QTL mapping for drought tolerance and disease resistance traits'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500 p-4 border border-red-200 rounded">
                <p className="font-semibold">Error loading JBrowse:</p>
                <p>{error}</p>
              </div>
            ) : viewState ? (
              <div className="border rounded-lg overflow-hidden">
                <JBrowseLinearGenomeView viewState={viewState} />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading JBrowse...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Assembly:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'ขาวดอกมะลิ 105 (Khao Dawk Mali 105)' : 'สุพรรณบุรี 1 (Suphan Buri 1)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cultivar Type:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'Jasmine Rice (Premium Aromatic)' : 'Field Rice (High-Yield Variety)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tracks Loaded:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'Reference Sequence + Gene Annotations (GFF3)' : 'Reference Sequence + QTL Markers'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Default Region:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'Chromosome 1: 2,000-20,000 bp' : 'Chromosome 3: 5,000-25,000 bp'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Special Features:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'Aroma genes, Amylose content markers' : 'Drought tolerance, Disease resistance QTLs'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
