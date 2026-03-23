import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GeneIdInputProps {
  geneId: string;
  onGeneIdChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const GeneIdInput: React.FC<GeneIdInputProps> = ({
  geneId,
  onGeneIdChange,
  placeholder = "e.g. AT1G01010",
  error,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="gene-locus" className="text-sm font-medium">
        Gene Locus
      </Label>
      <Input
        id="gene-locus"
        type="text"
        placeholder={placeholder}
        value={geneId}
        onChange={(e) => onGeneIdChange(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Enter a gene ID or gene symbol (e.g., AT1G01010, LOC_Os01g53090)
      </p>
    </div>
  );
};
