import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChromosomeSelector } from "./ChromosomeSelector";
import { PositionInput } from "./PositionInput";
import { GeneIdInput } from "./GeneIdInput";
import { searchApi } from "@/api/search";
import { SpeciesData } from "@/types";
import speciesData from "@/data/species.json";
import { MapPin, Search, Dna } from "lucide-react";

type SearchMode = "region" | "gene";

interface SearchFormProps {
  onSearchSubmit?: (jobId: string, mode: SearchMode) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearchSubmit }) => {
  const species = speciesData as SpeciesData;
  const speciesKeys = Object.keys(species);

  // Common state
  const [selectedSpecies, setSelectedSpecies] = useState(speciesKeys[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Region search state
  const [chromosome, setChromosome] = useState("");
  const [fromPosition, setFromPosition] = useState("");
  const [toPosition, setToPosition] = useState("");
  const [positionError, setPositionError] = useState<string | undefined>();

  // Gene search state
  const [geneId, setGeneId] = useState("");
  const [geneError, setGeneError] = useState<string | undefined>();

  // Get chromosomes for selected species
  const chromosomes = useMemo(() => {
    if (selectedSpecies && species[selectedSpecies]) {
      return species[selectedSpecies].chromosomes;
    }
    return [];
  }, [selectedSpecies, species]);

  // Reset chromosome when species changes
  const handleSpeciesChange = (value: string) => {
    setSelectedSpecies(value);
    setChromosome("");
    setError(null);
    setSuccessMessage(null);
  };

  // Validate region search
  const validateRegionSearch = (): boolean => {
    if (!chromosome) {
      setPositionError("Please select a chromosome");
      return false;
    }
    if (!fromPosition || !toPosition) {
      setPositionError("Please enter both start and end positions");
      return false;
    }
    const from = parseInt(fromPosition);
    const to = parseInt(toPosition);
    if (from >= to) {
      setPositionError("Start position must be less than end position");
      return false;
    }
    setPositionError(undefined);
    return true;
  };

  // Validate gene search
  const validateGeneSearch = (): boolean => {
    if (!geneId.trim()) {
      setGeneError("Please enter a gene ID");
      return false;
    }
    setGeneError(undefined);
    return true;
  };

  // Handle region search
  const handleRegionSearch = async () => {
    if (!validateRegionSearch()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await searchApi.searchByRegion({
        species: selectedSpecies,
        chromosome,
        fromPosition: parseInt(fromPosition),
        toPosition: parseInt(toPosition),
      });

      setSuccessMessage(
        `Job submitted successfully! Job ID: ${response.jobId}`,
      );
      onSearchSubmit?.(response.jobId, "region");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit search";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle gene search
  const handleGeneSearch = async () => {
    if (!validateGeneSearch()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await searchApi.searchByGene({
        species: selectedSpecies,
        geneId: geneId.trim(),
      });

      setSuccessMessage(
        `Job submitted successfully! Job ID: ${response.jobId}`,
      );
      onSearchSubmit?.(response.jobId, "gene");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit search";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Search className="h-5 w-5" />
          Genome Search
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search by genomic region or gene ID
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Species Selector - Common for both modes */}
        <div className="space-y-2">
          <Label htmlFor="species" className="text-sm font-medium">
            Species
          </Label>
          <Select value={selectedSpecies} onValueChange={handleSpeciesChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select species" />
            </SelectTrigger>
            <SelectContent>
              {speciesKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {species[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for search modes */}
        <Tabs defaultValue="region" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="region" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Search by Region
            </TabsTrigger>
            <TabsTrigger value="gene" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              Search by Gene ID
            </TabsTrigger>
          </TabsList>

          {/* Region Search Tab */}
          <TabsContent value="region" className="space-y-4 pt-4">
            <ChromosomeSelector
              chromosome={chromosome}
              chromosomes={chromosomes}
              onChromosomeChange={setChromosome}
              disabled={!selectedSpecies}
            />

            <PositionInput
              fromPosition={fromPosition}
              toPosition={toPosition}
              onFromChange={setFromPosition}
              onToChange={setToPosition}
              error={positionError}
            />

            <Button
              onClick={handleRegionSearch}
              disabled={loading || !selectedSpecies}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search by region
                </>
              )}
            </Button>
          </TabsContent>

          {/* Gene Search Tab */}
          <TabsContent value="gene" className="space-y-4 pt-4">
            <GeneIdInput
              geneId={geneId}
              onGeneIdChange={setGeneId}
              error={geneError}
            />

            <Button
              onClick={handleGeneSearch}
              disabled={loading || !selectedSpecies}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search by gene ID
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
            {successMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
