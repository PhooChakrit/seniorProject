import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Download, Loader2 } from "lucide-react";
import apiClient from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  SPACER_CLASS_FILTER_ORDER,
  sortSpacerClassLabels,
  spacerClassBadgeClassName,
} from "@/lib/spacerClassStyles";

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

type SortKey =
  | "position"
  | "minMM_GG"
  | "minMM_AG"
  | "seq"
  | "pam"
  | "strand"
  | "location";

type SortDirection = "asc" | "desc";

export const AnalysisResultsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<SpacerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [classFilter, setClassFilter] = useState<string>("__all__");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => {
    setClassFilter("__all__");
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    const fetchResults = async () => {
      try {
        const res = await apiClient.get(`/analysis/results-data/${jobId}`);
        if (res.data && res.data.results) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [jobId]);

  const parseSortableNumber = (value: string) => {
    const numeric = parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isNaN(numeric) ? Number.MAX_SAFE_INTEGER : numeric;
  };

  const classOptions = useMemo(() => {
    const fromData = new Set<string>();
    for (const r of results) {
      if (r.spacerClass?.trim()) fromData.add(r.spacerClass.trim());
    }
    const merged = new Set<string>([
      ...SPACER_CLASS_FILTER_ORDER,
      ...fromData,
    ]);
    return sortSpacerClassLabels([...merged]);
  }, [results]);

  const filteredResults = useMemo(() => {
    if (classFilter === "__all__") return results;
    return results.filter(
      (r) => (r.spacerClass ?? "").trim() === classFilter,
    );
  }, [results, classFilter]);

  const sortedResults = useMemo(() => {
    if (!sortKey) {
      return filteredResults;
    }

    const sorted = [...filteredResults].sort((a, b) => {
      let compare = 0;

      switch (sortKey) {
        case "position": {
          compare = parseSortableNumber(a.start) - parseSortableNumber(b.start);
          if (compare === 0) {
            compare = parseSortableNumber(a.end) - parseSortableNumber(b.end);
          }
          break;
        }
        case "minMM_GG":
          compare =
            parseSortableNumber(a.minMM_GG) - parseSortableNumber(b.minMM_GG);
          break;
        case "minMM_AG":
          compare =
            parseSortableNumber(a.minMM_AG) - parseSortableNumber(b.minMM_AG);
          break;
        case "seq":
          compare = a.seq.localeCompare(b.seq);
          break;
        case "pam":
          compare = a.pam.localeCompare(b.pam);
          break;
        case "strand":
          compare = a.strand.localeCompare(b.strand);
          break;
        case "location":
          compare = (a.location || "N/A").localeCompare(b.location || "N/A");
          break;
        default:
          compare = 0;
      }

      return sortDirection === "asc" ? compare : -compare;
    });

    return sorted;
  }, [filteredResults, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / rowsPerPage));

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedResults.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, rowsPerPage, sortedResults]);

  const pageStart = sortedResults.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(currentPage * rowsPerPage, sortedResults.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortDirection, sortKey, rowsPerPage, classFilter]);

  useEffect(() => {
    if (
      classFilter !== "__all__" &&
      classOptions.length > 0 &&
      !classOptions.includes(classFilter)
    ) {
      setClassFilter("__all__");
    }
  }, [classFilter, classOptions]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey(null);
    setSortDirection("asc");
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "SeqID",
      "Start",
      "End",
      "minMM_GG",
      "minMM_AG",
      "Sequence",
      "PAM",
      "Strand",
      "Location",
      "Class",
    ];
    const rows = sortedResults.map((r) => [
      r.seqId,
      r.start,
      r.end,
      r.minMM_GG,
      r.minMM_AG,
      r.seq,
      r.pam,
      r.strand,
      r.location || "N/A",
      r.spacerClass,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-results-${jobId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/analysis")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Analysis
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Analysis Results
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                {jobId}
              </p>
            </div>
          </div>
          {!loading && results.length > 0 && (
            <Button onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spacer Results</CardTitle>
            {!loading && (
              <CardDescription>
                {results.length} spacer{results.length !== 1 ? "s" : ""} found
                {classFilter !== "__all__" &&
                  filteredResults.length !== results.length && (
                    <>
                      {" "}
                      • {filteredResults.length} after class filter
                    </>
                  )}
                {sortedResults.length > 0 && (
                  <> • Showing {pageStart}-{pageEnd}</>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                Loading results...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 text-destructive">
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No results found for this job.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} / {totalPages}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Class
                      </span>
                      <Select
                        value={classFilter}
                        onValueChange={setClassFilter}
                      >
                        <SelectTrigger className="h-9 w-[min(100vw-4rem,11rem)] sm:w-[11rem]">
                          <SelectValue placeholder="All classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All classes</SelectItem>
                          {classOptions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Rows
                      </span>
                      <Select
                        value={String(rowsPerPage)}
                        onValueChange={(v) => setRowsPerPage(Number(v))}
                      >
                        <SelectTrigger className="h-9 w-[4.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="250">250</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("position")}
                        >
                          Position
                          {renderSortIcon("position")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("minMM_GG")}
                        >
                          minMM_GG
                          {renderSortIcon("minMM_GG")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("minMM_AG")}
                        >
                          minMM_AG
                          {renderSortIcon("minMM_AG")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("seq")}
                        >
                          Spacer Seq (5'→3')
                          {renderSortIcon("seq")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[60px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("pam")}
                        >
                          PAM
                          {renderSortIcon("pam")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[60px] text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("strand")}
                        >
                          Strand
                          {renderSortIcon("strand")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 font-semibold"
                          onClick={() => handleSort("location")}
                        >
                          Location
                          {renderSortIcon("location")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px] font-semibold">
                        Class
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((row, idx) => (
                      <TableRow key={`${row.seqId}-${row.start}-${row.end}-${idx}`}>
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
                        <TableCell className="font-mono text-xs">
                          {row.seq}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.pam}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.strand}
                        </TableCell>
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
