import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Search, Upload, ChevronDown, ChevronUp, Info } from 'lucide-react';

type NucleaseType = 'cas9' | 'cas12a';
type PurposeType = 'knock-out' | 'knock-in';

export const DataPage: React.FC = () => {
  const [target, setTarget] = useState('');
  const [species, setSpecies] = useState('Oryza sativa (IRGSP-1.0)');
  const [nuclease, setNuclease] = useState<NucleaseType>('cas9');
  const [purpose, setPurpose] = useState<PurposeType>('knock-out');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Advanced options
  const [pamOverride, setPamOverride] = useState('NGG');
  const [guideLength, setGuideLength] = useState('20');
  const [maxMismatch, setMaxMismatch] = useState('3');
  const [offTargetSensitivity, setOffTargetSensitivity] = useState('medium');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFindTargets = async () => {
    if (!target.trim()) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // TODO: Implement actual CRISPR target finding logic
    }, 1500);
  };

  const handlePasteSequence = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTarget(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleUploadFasta = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTarget(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">CRISPR Guide RNA Design</h1>
          <p className="text-lg text-muted-foreground">
            Design highly specific guide RNAs for your CRISPR experiments
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl">Target Selection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your target gene or sequence to find optimal CRISPR sites
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* 1. Target Input Section */}
            <div className="space-y-3">
              <Label htmlFor="target" className="text-base font-semibold">
                Target Input
              </Label>
              <div className="relative">
                <textarea
                  id="target"
                  className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Gene ID, coordinates, or DNA sequence (e.g. LOC_Os01g53090, chr3:1203000-1203900, or paste ATGC...)"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasteSequence}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Paste Sequence
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadFasta}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload FASTA
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fasta,.fa,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Accepts: Gene ID / Genomic Coordinates / DNA Sequence / FASTA File
              </p>
            </div>

            {/* 2. Species Selector */}
            <div className="space-y-3">
              <Label htmlFor="species" className="text-base font-semibold">
                Species
              </Label>
              <Select
                id="species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="max-w-md"
              >
                <option value="Oryza sativa (IRGSP-1.0)">Oryza sativa (IRGSP-1.0)</option>
                <option value="Homo sapiens (hg38/GRCh38)">Homo sapiens (hg38/GRCh38)</option>
                <option value="Mus musculus (mm10/GRCm38)">Mus musculus (mm10/GRCm38)</option>
                <option value="Arabidopsis thaliana (TAIR10)">Arabidopsis thaliana (TAIR10)</option>
              </Select>
            </div>

            {/* 3. Nuclease Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Nuclease (Cas System)</Label>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={nuclease === 'cas9' ? 'default' : 'outline'}
                  onClick={() => setNuclease('cas9')}
                  className="px-6"
                >
                  Cas9 <span className="ml-2 font-mono text-xs">(NGG)</span>
                </Button>
                <Button
                  variant={nuclease === 'cas12a' ? 'default' : 'outline'}
                  onClick={() => setNuclease('cas12a')}
                  className="px-6"
                >
                  Cas12a <span className="ml-2 font-mono text-xs">(TTTV)</span>
                </Button>
                <Button variant="outline" className="px-6 text-muted-foreground">
                  More...
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PAM sequence shown in parentheses. Select the nuclease for your experiment.
              </p>
            </div>

            {/* 4. Purpose Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Purpose</Label>
                <div className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-lg text-xs z-10">
                    Affects gRNA ranking preferences. Knock-out prioritizes early stop codons, 
                    while knock-in focuses on specific insertion sites.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant={purpose === 'knock-out' ? 'default' : 'outline'}
                  onClick={() => setPurpose('knock-out')}
                  className="px-8"
                >
                  Knock-out
                </Button>
                <Button
                  variant={purpose === 'knock-in' ? 'default' : 'outline'}
                  onClick={() => setPurpose('knock-in')}
                  className="px-8"
                >
                  Knock-in
                </Button>
              </div>
            </div>

            {/* 5. Advanced Options */}
            <div className="border-t pt-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-base font-semibold hover:text-primary transition-colors"
              >
                Advanced Options
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="pam">PAM Override</Label>
                    <Input
                      id="pam"
                      value={pamOverride}
                      onChange={(e) => setPamOverride(e.target.value)}
                      placeholder="NGG"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guideLength">Guide Length (bp)</Label>
                    <Input
                      id="guideLength"
                      type="number"
                      value={guideLength}
                      onChange={(e) => setGuideLength(e.target.value)}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMismatch">Max Mismatch</Label>
                    <Input
                      id="maxMismatch"
                      type="number"
                      value={maxMismatch}
                      onChange={(e) => setMaxMismatch(e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sensitivity">Off-target Sensitivity</Label>
                    <Select
                      id="sensitivity"
                      value={offTargetSensitivity}
                      onChange={(e) => setOffTargetSensitivity(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Primary Action Button */}
            <div className="pt-4 flex justify-center">
              <Button
                size="lg"
                onClick={handleFindTargets}
                disabled={loading || !target.trim()}
                className="px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Search className="mr-2 h-5 w-5" />
                {loading ? 'Searching for Target Sites...' : 'Find Target Sites'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section - Placeholder */}
        {loading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Analyzing sequences and finding optimal CRISPR sites...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
