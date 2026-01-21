import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedOptionsProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  pamOverride: string;
  onPamOverrideChange: (value: string) => void;
  guideLength: string;
  onGuideLengthChange: (value: string) => void;
  maxMismatch: string;
  onMaxMismatchChange: (value: string) => void;
  offTargetSensitivity: string;
  onOffTargetSensitivityChange: (value: string) => void;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  showAdvanced,
  onToggleAdvanced,
  pamOverride,
  onPamOverrideChange,
  guideLength,
  onGuideLengthChange,
  maxMismatch,
  onMaxMismatchChange,
  offTargetSensitivity,
  onOffTargetSensitivityChange,
}) => {
  return (
    <div className="border-t pt-6">
      <button
        onClick={onToggleAdvanced}
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
              onChange={(e) => onPamOverrideChange(e.target.value)}
              placeholder="NGG"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guideLength">Guide Length (bp)</Label>
            <Input
              id="guideLength"
              type="number"
              value={guideLength}
              onChange={(e) => onGuideLengthChange(e.target.value)}
              placeholder="20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxMismatch">Max Mismatch</Label>
            <Input
              id="maxMismatch"
              type="number"
              value={maxMismatch}
              onChange={(e) => onMaxMismatchChange(e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sensitivity">Off-target Sensitivity</Label>
            <Select value={offTargetSensitivity} onValueChange={onOffTargetSensitivityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
