import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PositionInputProps {
  fromPosition: string;
  toPosition: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  error?: string;
}

export const PositionInput: React.FC<PositionInputProps> = ({
  fromPosition,
  toPosition,
  onFromChange,
  onToChange,
  error,
}) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    onFromChange(value);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    onToChange(value);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from-position" className="text-sm font-medium">
            From
          </Label>
          <Input
            id="from-position"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 10000"
            value={fromPosition}
            onChange={handleFromChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-position" className="text-sm font-medium">
            To
          </Label>
          <Input
            id="to-position"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 20000"
            value={toPosition}
            onChange={handleToChange}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
