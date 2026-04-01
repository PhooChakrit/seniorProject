import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import apiClient from "@/lib/axios";
import { genomeApi } from "@/api/genome";
import { GeneIdInput } from "@/components/crispr/GeneIdInput";

interface GeneSearchFormProps {
  onSubmit: (jobId: string, geneId: string) => void;
}

export const GeneSearchForm: React.FC<GeneSearchFormProps> = ({
  onSubmit,
}) => {
  const [varietyId, setVarietyId] = useState("");
  const [geneId, setGeneId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: varieties = [],
    isLoading: varietiesLoading,
    isError: varietiesError,
  } = useQuery({
    queryKey: ["analysisVarieties"],
    queryFn: genomeApi.getAnalysisVarieties,
  });

  const selectedVariety = useMemo(
    () => varieties.find((v) => v.id === varietyId) ?? varieties[0],
    [varietyId, varieties],
  );

  useEffect(() => {
    if (!varieties.length) return;
    const current = varietyId;
    const fallback = varieties[0];
    const nextId = varieties.find((v) => v.id === current)?.id ?? fallback.id;
    if (nextId !== current) {
      setVarietyId(nextId);
    }
  }, [varieties, varietyId]);

  const genePlaceholder = useMemo(() => {
    if (selectedVariety?.id === "oryza") return "Os01g0100100";
    if (selectedVariety?.id === "kdml105") return "g14938";
    return "e.g. Os01g0100100";
  }, [selectedVariety?.id]);

  const geneHint =
    "Use the gene ID format from the annotation for this genome (e.g. RAP/Ensembl Os01g… for IRGSP, or your cultivar’s GFF IDs).";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmed = geneId.trim();
    if (!trimmed) {
      setFormError("Please enter a gene ID.");
      return;
    }
    if (!selectedVariety) {
      setFormError("Select a genome first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/analysis/submit-by-gene", {
        variety: selectedVariety.id,
        geneId: trimmed,
        options: {
          pam: "NGG",
          spacerLength: 20,
          mismatches: 3,
        },
      });
      if (res.data.jobId) {
        onSubmit(res.data.jobId, trimmed);
        setGeneId("");
      }
    } catch (err) {
      console.error("Gene analysis submit failed:", err);
      setFormError("Could not submit job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Species / genome</Label>
        <Select
          value={selectedVariety?.id ?? ""}
          onValueChange={setVarietyId}
          disabled={varietiesLoading || varietiesError}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select genome" />
          </SelectTrigger>
          <SelectContent>
            {varieties.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {varietiesLoading
            ? "Loading genomes…"
            : varietiesError
              ? "Could not load genome list."
              : "Same genomes as custom region analysis."}
        </p>
      </div>

      <GeneIdInput
        geneId={geneId}
        onGeneIdChange={setGeneId}
        placeholder={genePlaceholder}
        hint={geneHint}
      />

      {formError && (
        <p className="text-sm text-red-500" role="alert">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        disabled={
          submitting ||
          varietiesLoading ||
          varietiesError ||
          !selectedVariety ||
          !varieties.length
        }
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Search by gene ID
          </>
        )}
      </Button>
    </form>
  );
};
