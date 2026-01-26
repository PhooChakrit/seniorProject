import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import apiClient from "@/lib/axios";

interface Spacer {
  id: number;
  species: string;
  chromosome: string;
  startPos: number;
  endPos: number;
  strand: string;
  spacerSeq: string;
  pam: string;
  location?: string;
  minMM_GG?: string;
  minMM_AG?: string;
  spacerClass?: string;
}

interface SpacersResponse {
  spacers: Spacer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  query: {
    species: string;
    chromosome: string;
    from: number;
    to: number;
  };
}

interface SpacersTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  species: string;
  chromosome: string;
  fromPosition: number;
  toPosition: number;
}

const getClassColor = (spacerClass?: string): string => {
  if (!spacerClass) return "bg-gray-100";
  if (spacerClass.startsWith("A0") || spacerClass.startsWith("B0")) {
    return "bg-green-100 text-green-800";
  }
  if (spacerClass.startsWith("A1") || spacerClass.startsWith("B1")) {
    return "bg-yellow-100 text-yellow-800";
  }
  if (spacerClass.startsWith("A2") || spacerClass.startsWith("B2")) {
    return "bg-orange-100 text-orange-800";
  }
  return "bg-gray-100";
};

export const SpacersTableModal: React.FC<SpacersTableModalProps> = ({
  open,
  onOpenChange,
  species,
  chromosome,
  fromPosition,
  toPosition,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spacers, setSpacers] = useState<Spacer[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchSpacers = useCallback(
    async (page: number = 1) => {
      if (!chromosome || fromPosition >= toPosition) return;

      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<SpacersResponse>(
          "/genome/spacers",
          {
            params: {
              species,
              chromosome,
              from: fromPosition,
              to: toPosition,
              page,
              limit: 50,
            },
          },
        );
        setSpacers(data.spacers);
        setPagination(data.pagination);
      } catch (err) {
        setError("Failed to fetch spacers");
        console.error("Error fetching spacers:", err);
      } finally {
        setLoading(false);
      }
    },
    [species, chromosome, fromPosition, toPosition],
  );

  useEffect(() => {
    if (open && chromosome && fromPosition < toPosition) {
      fetchSpacers(1);
    }
  }, [open, fetchSpacers, chromosome, fromPosition, toPosition]);

  const handleDownloadCSV = () => {
    if (spacers.length === 0) return;

    const headers = [
      "SeqID",
      "minMM_GG",
      "minMM_AG",
      "Spacer Seq (5'->3')",
      "PAM (5'->3')",
      "Strand",
      "Location",
      "Class",
    ];

    const rows = spacers.map((s) => [
      `${s.chromosome}:${s.startPos}-${s.endPos}${s.strand === "-" ? ":rc" : ""}`,
      s.minMM_GG || "",
      s.minMM_AG || "",
      s.spacerSeq,
      s.pam,
      s.strand,
      s.location || "",
      s.spacerClass || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spacers_${chromosome}_${fromPosition}-${toPosition}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>CRISPR Spacers</DialogTitle>
          <DialogDescription>
            {species} / {chromosome}: {fromPosition.toLocaleString()} -{" "}
            {toPosition.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between py-2 border-b">
            <div className="text-sm text-muted-foreground">
              {loading
                ? "Loading..."
                : `Found ${pagination.total.toLocaleString()} spacers`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={spacers.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            ) : spacers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No spacers found in this region
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">SeqID</th>
                    <th className="px-3 py-2 text-left font-medium">
                      minMM_GG
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      minMM_AG
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Spacer Seq (5'→3')
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      PAM (5'→3')
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Strand</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Class</th>
                  </tr>
                </thead>
                <tbody>
                  {spacers.map((spacer, index) => (
                    <tr
                      key={spacer.id}
                      className={`border-b hover:bg-muted/50 ${
                        index % 2 === 0 ? "bg-white" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">
                        {spacer.chromosome}:{spacer.startPos}-{spacer.endPos}
                        {spacer.strand === "-" ? ":rc" : ""}
                      </td>
                      <td className="px-3 py-2">{spacer.minMM_GG || "-"}</td>
                      <td className="px-3 py-2">{spacer.minMM_AG || "-"}</td>
                      <td className="px-3 py-2 font-mono text-xs tracking-wider">
                        {spacer.spacerSeq}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {spacer.pam}
                      </td>
                      <td className="px-3 py-2">{spacer.strand}</td>
                      <td className="px-3 py-2">{spacer.location || "-"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getClassColor(
                            spacer.spacerClass,
                          )}`}
                        >
                          {spacer.spacerClass || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSpacers(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSpacers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
