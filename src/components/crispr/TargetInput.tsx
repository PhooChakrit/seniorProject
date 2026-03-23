import React from "react";
// import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { Upload } from "lucide-react";

interface TargetInputProps {
  target: string;
  onTargetChange: (value: string) => void;
  onPasteSequence: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TargetInput: React.FC<TargetInputProps> = ({
  target,
  onTargetChange,
  // onPasteSequence,
  // onFileChange,
}) => {
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // const handleUploadClick = () => {
  //   fileInputRef.current?.click();
  // };

  return (
    <div className="space-y-3">
      <Label htmlFor="target" className="text-base font-semibold">
        Target Input
      </Label>
      <div className="relative">
        <textarea
          id="target"
          className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-input bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Gene ID, coordinates, or DNA sequence (e.g. LOC_Os01g53090, chr3:1203000-1203900, or paste ATGC...)"
          value={target}
          onChange={(e) => onTargetChange(e.target.value)}
        />
      </div>
      {/* <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPasteSequence}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Paste Sequence
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload FASTA
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".fasta,.fa,.txt"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Accepts: Gene ID / Genomic Coordinates / DNA Sequence / FASTA File
      </p> */}
    </div>
  );
};
