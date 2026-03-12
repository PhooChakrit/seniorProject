import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import apiClient from "@/lib/axios";

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

export const AnalysisResultsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<SpacerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getClassBadgeVariant = (cls: string) => {
    if (cls.includes("A0") || cls.includes("B0")) return "default";
    if (cls.includes("Off-Target")) return "destructive";
    return "secondary";
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
    const rows = results.map((r) => [
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
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Position</TableHead>
                      <TableHead className="w-[80px] text-center">
                        minMM_GG
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        minMM_AG
                      </TableHead>
                      <TableHead>Spacer Seq (5'→3')</TableHead>
                      <TableHead className="w-[60px]">PAM</TableHead>
                      <TableHead className="w-[60px] text-center">
                        Strand
                      </TableHead>
                      <TableHead className="w-[100px]">Location</TableHead>
                      <TableHead className="w-[120px]">Class</TableHead>
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
                          <Badge variant={getClassBadgeVariant(row.spacerClass)}>
                            {row.spacerClass}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
