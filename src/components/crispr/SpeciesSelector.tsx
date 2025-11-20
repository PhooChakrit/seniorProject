import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      <Select value={species} onValueChange={onSpeciesChange}>
        <SelectTrigger className="max-w-md">
          <SelectValue placeholder="Select a rice variety" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Oryza sativa (IRGSP-1.0)">ขาวดอกมะลิ 105 (Khao Dawk Mali 105)</SelectItem>
          <SelectItem value="Homo sapiens (hg38/GRCh38)">สุพรรณบุรี 1 (Suphan Buri 1)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
