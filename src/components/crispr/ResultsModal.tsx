import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { spacerClassBadgeClassName } from "@/lib/spacerClassStyles";

interface SpacerResult {
  seqId: string;
  start: string;
  end: string;
  minMM_GG: string;
  minMM_AG: string;
  seq: string;
  pam: string;
  strand: string;
  location: string;
  spacerClass: string;
}

interface ResultsModalProps {
  open: boolean;
  onClose: () => void;
  results: SpacerResult[];
  jobId: string;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  open,
  onClose,
  results,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Analysis Results
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({results.length} spacers found)
            </span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Position</TableHead>
                <TableHead className="w-[70px] text-center">minMM_GG</TableHead>
                <TableHead className="w-[70px] text-center">minMM_AG</TableHead>
                <TableHead>Spacer Seq (5'→3')</TableHead>
                <TableHead className="w-[50px]">PAM</TableHead>
                <TableHead className="w-[50px] text-center">Strand</TableHead>
                <TableHead className="w-[80px]">Location</TableHead>
                <TableHead className="w-[100px]">Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">
                    {row.start}-{row.end}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    <span
                      className={
                        row.minMM_GG.endsWith("+")
                          ? "text-green-600 font-semibold"
                          : "text-orange-600"
                      }
                    >
                      {row.minMM_GG}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    <span
                      className={
                        row.minMM_AG.endsWith("+")
                          ? "text-green-600 font-semibold"
                          : "text-orange-600"
                      }
                    >
                      {row.minMM_AG}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.seq}</TableCell>
                  <TableCell className="font-mono text-xs">{row.pam}</TableCell>
                  <TableCell className="text-center">{row.strand}</TableCell>
                  <TableCell>{row.location || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shadow-none",
                        spacerClassBadgeClassName(row.spacerClass),
                      )}
                    >
                      {row.spacerClass}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
