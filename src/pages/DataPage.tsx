import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export const DataPage: React.FC = () => {
  const [target, setTarget] = useState('');
  const [species, setSpecies] = useState('Homo sapiens (hg38/GRCh38)');
  const [tool, setTool] = useState('CRISPR/Cas9');
  const [purpose, setPurpose] = useState('knock-out');
  const [results] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFindTargets = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // TODO: Mock results would be set here
    }, 1000);
  };

  const handlePasteTarget = () => {
    navigator.clipboard.readText().then((text) => {
      setTarget(text);
    });
  };

  const handleResetOptions = () => {
    setSpecies('Homo sapiens (hg38/GRCh38)');
    setTool('CRISPR/Cas9');
    setPurpose('knock-out');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRISPR Design Tool</h2>
          <p className="text-muted-foreground">
            Design guide RNAs for CRISPR/Cas9 gene editing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Target Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Target Input */}
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  placeholder="e.g. EXT1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  RefSeq/ENSEMBL/gene ID or genomic coordinates.
                </p>
              </div>

              {/* Species Select */}
              <div className="space-y-2">
                <Label htmlFor="species">In</Label>
                <Select
                  id="species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  <option value="Homo sapiens (hg38/GRCh38)">
                    Homo sapiens (hg38/GRCh38)
                  </option>
                  <option value="Mus musculus (mm10/GRCm38)">
                    Mus musculus (mm10/GRCm38)
                  </option>
                  <option value="Oryza sativa (IRGSP-1.0)">
                    Oryza sativa (IRGSP-1.0)
                  </option>
                </Select>
                <button
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => {}}
                >
                  Add new species.
                </button>
              </div>

              {/* Tool Select */}
              <div className="space-y-2">
                <Label htmlFor="tool">Using</Label>
                <Select
                  id="tool"
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                >
                  <option value="CRISPR/Cas9">CRISPR/Cas9</option>
                  <option value="CRISPR/Cas12a">CRISPR/Cas12a</option>
                  <option value="CRISPR/Cas13">CRISPR/Cas13</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Change default PAM and guide length in Options.
                </p>
              </div>

              {/* Purpose Select */}
              <div className="space-y-2">
                <Label htmlFor="purpose">For</Label>
                <Select
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="knock-out">knock-out</option>
                  <option value="activation">activation</option>
                  <option value="inhibition">inhibition</option>
                  <option value="base-editing">base-editing</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Presets can be adjusted in Options.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={handlePasteTarget}
              >
                Paste Target
              </Button>
              <Button
                variant="outline"
                onClick={() => {}}
              >
                Options
              </Button>
              <Button
                variant="outline"
                onClick={handleResetOptions}
              >
                Reset Options
              </Button>
            </div>

            {/* Find Target Sites Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="px-12"
                onClick={handleFindTargets}
                disabled={loading || !target}
              >
                {loading ? 'Searching...' : 'Find Target Sites!'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Target Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((_, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md hover:bg-accent transition-colors"
                  >
                    {/* Results will be displayed here */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
