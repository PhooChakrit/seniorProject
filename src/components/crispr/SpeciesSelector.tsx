import React from 'react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface SpeciesSelectorProps {
  species: string;
  onSpeciesChange: (value: string) => void;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  species,
  onSpeciesChange,
}) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="species" className="text-base font-semibold">
        Species
      </Label>
      <Select
        id="species"
        value={species}
        onChange={(e) => onSpeciesChange(e.target.value)}
        className="max-w-md"
      >
        <option value="Oryza sativa (IRGSP-1.0)">Oryza sativa (IRGSP-1.0)</option>
        <option value="Homo sapiens (hg38/GRCh38)">Homo sapiens (hg38/GRCh38)</option>
        <option value="Mus musculus (mm10/GRCm38)">Mus musculus (mm10/GRCm38)</option>
        <option value="Arabidopsis thaliana (TAIR10)">Arabidopsis thaliana (TAIR10)</option>
      </Select>
    </div>
  );
};
