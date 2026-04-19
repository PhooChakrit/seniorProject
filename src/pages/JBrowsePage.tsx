import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { genomeApi } from '@/api/genome';

const apiBasePath = (import.meta.env.VITE_API_BASE_PATH || '/api').replace(/\/+$/, '');
const apiGatewayPath = apiBasePath.endsWith('/api') ? apiBasePath.slice(0, -4) : '';

function mapGenomeUri(uri: string): string {
  if (!uri.startsWith('/genomes/')) {
    return uri;
  }

  return apiGatewayPath ? `${apiGatewayPath}${uri}` : uri;
}

function rewriteGenomeUris(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => rewriteGenomeUris(entry));
  }

  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, entryValue] of Object.entries(input)) {
      if (key === 'uri' && typeof entryValue === 'string') {
        output[key] = mapGenomeUri(entryValue);
      } else {
        output[key] = rewriteGenomeUris(entryValue);
      }
    }

    return output;
  }

  return value;
}

export const JBrowsePage: React.FC = () => {
  const [viewState, setViewState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('');

  const { data: genomeConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['genomeConfigs'],
    queryFn: genomeApi.getGenomeConfigs,
  });

  const genome = genomeConfigs.find((g) => g.key === selectedKey) ?? genomeConfigs[0];

  // Set default selected key once configs are loaded
  useEffect(() => {
    if (genomeConfigs.length > 0 && !selectedKey) {
      setSelectedKey(genomeConfigs[0].key);
    }
  }, [genomeConfigs, selectedKey]);

  useEffect(() => {
    if (!genome) return;
    try {
      setError(null);
      const assemblyConfig = rewriteGenomeUris(genome.assemblyConfig);
      const tracks = rewriteGenomeUris(genome.tracks);
      const defaultSession = rewriteGenomeUris(genome.defaultSession);
      const state = createViewState({
        assembly: assemblyConfig as any,
        tracks: tracks as any,
        location: genome.defaultLocation,
        defaultSession: defaultSession as any,
      });
      setViewState(state);
    } catch (err: any) {
      console.error('Error creating JBrowse view state:', err);
      setError(err.message || 'Failed to initialize JBrowse');
    }
  }, [genome]);

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
              value={selectedKey}
              onValueChange={setSelectedKey}
              disabled={configsLoading}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a genome" />
              </SelectTrigger>
              <SelectContent>
                {genomeConfigs.map((g) => (
                  <SelectItem key={g.key} value={g.key}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{genome?.label ?? ''}</CardTitle>
            <CardDescription>{genome?.description ?? ''}</CardDescription>
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
                <span className="text-muted-foreground">{genome?.assemblyName ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cultivar Type:</span>
                <span className="text-muted-foreground">{genome?.cultivarType ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tracks Loaded:</span>
                <span className="text-muted-foreground">{genome?.tracksLoaded ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Default Region:</span>
                <span className="text-muted-foreground">{genome?.defaultRegion ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Special Features:</span>
                <span className="text-muted-foreground">{genome?.specialFeatures ?? ''}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
