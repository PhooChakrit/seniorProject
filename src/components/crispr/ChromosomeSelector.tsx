import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chromosome } from "@/types";

interface ChromosomeSelectorProps {
  chromosome: string;
  chromosomes: Chromosome[];
  onChromosomeChange: (value: string) => void;
  disabled?: boolean;
}

export const ChromosomeSelector: React.FC<ChromosomeSelectorProps> = ({
  chromosome,
  chromosomes,
  onChromosomeChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="chromosome" className="text-sm font-medium">
        Chromosome
      </Label>
      <Select
        value={chromosome}
        onValueChange={onChromosomeChange}
        disabled={disabled || chromosomes.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select chromosome" />
        </SelectTrigger>
        <SelectContent>
          {chromosomes.map((chr) => (
            <SelectItem key={chr.id} value={chr.id}>
              {chr.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
