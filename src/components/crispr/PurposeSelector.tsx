import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

type PurposeType = 'knock-out' | 'knock-in';

interface PurposeSelectorProps {
  purpose: PurposeType;
  onPurposeChange: (value: PurposeType) => void;
}

export const PurposeSelector: React.FC<PurposeSelectorProps> = ({
  purpose,
  onPurposeChange,
}) => {
  return (
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
          onClick={() => onPurposeChange('knock-out')}
          className="px-8"
        >
          Knock-out
        </Button>
        <Button
          variant={purpose === 'knock-in' ? 'default' : 'outline'}
          onClick={() => onPurposeChange('knock-in')}
          className="px-8"
        >
          Knock-in
        </Button>
      </div>
    </div>
  );
};
