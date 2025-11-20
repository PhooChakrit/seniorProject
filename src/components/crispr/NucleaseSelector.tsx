import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type NucleaseType = 'cas9' | 'cas12a';

interface NucleaseSelectorProps {
  nuclease: NucleaseType;
  onNucleaseChange: (value: NucleaseType) => void;
}

export const NucleaseSelector: React.FC<NucleaseSelectorProps> = ({
  nuclease,
  onNucleaseChange,
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Nuclease (Cas System)</Label>
      <div className="flex flex-wrap gap-3">
        <Button
          variant={nuclease === 'cas9' ? 'default' : 'outline'}
          onClick={() => onNucleaseChange('cas9')}
          className="px-6"
        >
          Cas9 <span className="ml-2 font-mono text-xs">(NGG)</span>
        </Button>
        <Button
          variant={nuclease === 'cas12a' ? 'default' : 'outline'}
          onClick={() => onNucleaseChange('cas12a')}
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
  );
};
