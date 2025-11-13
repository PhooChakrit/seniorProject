import React, { useEffect, useState } from 'react';
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Oryza sativa (Rice) genome configuration
const oryzaAssembly = {
  name: 'Oryza_sativa',
  aliases: ['IRGSP-1.0'],
  sequence: {
    type: 'ReferenceSequenceTrack',
    trackId: 'Oryza-ReferenceSequenceTrack',
    adapter: {
      type: 'FromConfigSequenceAdapter',
      features: [
        {
          refName: '1',
          uniqueId: 'chr1',
          start: 0,
          end: 43270923,
        },
      ],
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
          <div className="flex gap-2">
            <Button
              variant={useOryza ? 'default' : 'outline'}
              onClick={() => setUseOryza(true)}
            >
              Oryza (Rice)
            </Button>
            <Button
              variant={!useOryza ? 'default' : 'outline'}
              onClick={() => setUseOryza(false)}
            >
              Human (GRCh38)
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {useOryza ? 'Oryza sativa (Rice) Genome' : 'Human Genome (GRCh38/hg38)'}
            </CardTitle>
            <CardDescription>
              {useOryza
                ? 'Interactive genome browser with Oryza DNA annotations'
                : 'Interactive genome browser with gene annotations and variant data'}
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
                  {useOryza ? 'Oryza sativa' : 'GRCh38 (hg38)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tracks Loaded:</span>
                <span className="text-muted-foreground">
                  {useOryza ? 'Oryza DNA Annotations (GFF3)' : 'NCBI RefSeq Genes'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Default Region:</span>
                <span className="text-muted-foreground">
                  {useOryza ? '1:2000-20000' : 'chr1:1-100,000'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
