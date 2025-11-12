import React, { useEffect, useRef, useState } from 'react';
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sample genome configuration for JBrowse 2
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

  useEffect(() => {
    try {
      const state = createViewState({
        assembly,
        tracks,
        location: 'chr1:1-100,000',
        defaultSession,
      });
      setViewState(state);
    } catch (err: any) {
      console.error('Error creating JBrowse view state:', err);
      setError(err.message || 'Failed to initialize JBrowse');
    }
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">JBrowse 2 Genome Browser</h2>
          <p className="text-muted-foreground">
            Explore genomic data with the interactive JBrowse 2 browser
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Human Genome (GRCh38/hg38)</CardTitle>
            <CardDescription>
              Interactive genome browser with gene annotations and variant data
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
                <span className="text-muted-foreground">GRCh38 (hg38)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tracks Loaded:</span>
                <span className="text-muted-foreground">NCBI RefSeq Genes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Default Region:</span>
                <span className="text-muted-foreground">chr1:1-100,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
