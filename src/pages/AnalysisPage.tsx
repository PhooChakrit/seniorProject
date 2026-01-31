import React, { useState, useEffect } from "react";
import { AnalysisForm } from "@/components/crispr/AnalysisForm";
import { ResultsModal } from "@/components/crispr/ResultsModal";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  Eye,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";

interface Job {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  species?: string;
  fromPosition?: number;
  toPosition?: number;
}

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

export const AnalysisPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [results, setResults] = useState<SpacerResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get("/analysis/jobs");
      if (res.data.jobs) {
        setJobs(res.data.jobs);

        // Start polling for active jobs
        const activeJobs = res.data.jobs.filter((j: Job) =>
          ["pending", "processing"].includes(j.status),
        );
        if (activeJobs.length > 0) {
          startPolling();
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get("/analysis/jobs");
        if (res.data.jobs) {
          setJobs(res.data.jobs);

          const activeJobs = res.data.jobs.filter((j: Job) =>
            ["pending", "processing"].includes(j.status),
          );
          if (activeJobs.length === 0) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
      }
    }, 5000);
  };

  const handleJobSubmitted = (jobId: string) => {
    // Add new job to list
    const newJob: Job = {
      jobId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
    startPolling();
  };

  const handleViewResults = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoadingResults(true);
    try {
      const res = await apiClient.get(`/analysis/results-data/${jobId}`);
      if (res.data && res.data.results) {
        setResults(res.data.results);
        setShowResultsModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Custom Analysis</h1>
          <p className="text-muted-foreground">
            Run the full CRISPR-PLANT v2 pipeline on your selected genome with
            custom parameters.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Run New Analysis
                </CardTitle>
                <CardDescription>
                  Configure parameters for off-target search and annotation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalysisForm onSubmit={handleJobSubmitted} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Job History</CardTitle>
                <CardDescription>
                  {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <div
                          key={job.jobId}
                          className={`p-3 border rounded-lg transition-colors ${
                            job.status === "completed"
                              ? "hover:bg-green-50 cursor-pointer border-green-200"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() =>
                            job.status === "completed" &&
                            handleViewResults(job.jobId)
                          }
                        >
                          <div className="flex items-center justify-between mb-2">
                            {getStatusBadge(job.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-mono text-xs text-muted-foreground">
                              {job.jobId.slice(0, 20)}...
                            </span>
                          </div>
                          {job.fromPosition && job.toPosition && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Region: {job.fromPosition.toLocaleString()} -{" "}
                              {job.toPosition.toLocaleString()}
                            </div>
                          )}
                          {job.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewResults(job.jobId);
                              }}
                              disabled={
                                loadingResults && selectedJobId === job.jobId
                              }
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {loadingResults && selectedJobId === job.jobId
                                ? "Loading..."
                                : "View Results"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Calculator className="h-12 w-12 mb-4 opacity-20" />
                    <p>No jobs yet</p>
                    <p className="text-sm">Submit a job on the left to start</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ResultsModal
        open={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={results}
        jobId={selectedJobId || ""}
      />
    </Layout>
  );
};
