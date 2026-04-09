import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnalysisForm } from "@/components/crispr/AnalysisForm";
import { GeneSearchForm } from "@/components/crispr/GeneSearchForm";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { formatAnalysisJobTitle } from "@/lib/analysisJobLabel";

interface Job {
  jobId: string;
  type?: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  species?: string;
  chromosome?: string | null;
  fromPosition?: number | null;
  toPosition?: number | null;
  geneId?: string | null;
}

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queueWaiting, setQueueWaiting] = useState<number | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await apiClient.get("/analysis/jobs");
      const list: Job[] = res.data.jobs || [];
      setJobs(list);
      if (typeof res.data.queueWaiting === "number") {
        setQueueWaiting(res.data.queueWaiting);
      } else {
        setQueueWaiting(null);
      }

      const activeJobs = list.filter((j) =>
        ["pending", "processing"].includes(j.status),
      );
      if (activeJobs.length === 0) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          void loadJobs();
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [loadJobs]);

  const handleJobSubmitted = (_jobId: string, _geneId?: string) => {
    void loadJobs();
  };

  const handleViewResults = (jobId: string) => {
    navigate(`/analysis/results/${jobId}`);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      setDeletingJobId(jobId);
      await apiClient.delete(`/analysis/${jobId}`);
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      console.error("Failed to delete job:", err);
    } finally {
      setDeletingJobId(null);
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Run analysis</CardTitle>
              <CardDescription>
                Choose how you want to define the target: by gene ID (resolved
                from GFF3) or by a custom genomic region.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gene">
                <TabsList className="mb-4">
                  <TabsTrigger value="gene">Gene ID</TabsTrigger>
                  <TabsTrigger value="region">Custom region</TabsTrigger>
                </TabsList>

                <TabsContent value="gene" className="mt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">
                        Search by gene ID
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Coordinates are taken from the genome’s GFF3 annotation,
                        then the same CRISPR-PLANT pipeline runs as for a custom
                        region.
                      </div>
                    </div>
                    <GeneSearchForm
                      onSubmit={(jobId, gid) => handleJobSubmitted(jobId, gid)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="region" className="mt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Calculator className="h-4 w-4" />
                      Run New Analysis
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Configure parameters for off-target search and annotation.
                    </div>
                    <AnalysisForm onSubmit={handleJobSubmitted} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Use a wrapper div that is relative only on desktop to serve as anchor for absolute card */}
          <div className="md:relative">
            <Card className="flex flex-col md:absolute md:inset-0 max-h-[600px] md:max-h-none">
              <CardHeader>
                <CardTitle>Job History</CardTitle>
                <CardDescription className="space-y-1">
                  <span>
                    {jobs.length} job{jobs.length !== 1 ? "s" : ""} in your history
                  </span>
                  {queueWaiting !== null ? (
                    <span className="block text-xs">
                      คิว worker (RabbitMQ):{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {queueWaiting}
                      </span>{" "}
                      งานที่รอประมวลผล
                    </span>
                  ) : (
                    <span className="block text-xs text-muted-foreground">
                      ไม่สามารถอ่านจำนวนคิวได้ (ตรวจสอบ RabbitMQ / API)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {jobs.length > 0 ? (
                  <div className="space-y-3 pr-2">
                    {jobs.map((job, index) => (
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
                        <div className="text-sm font-medium text-foreground leading-snug break-words">
                          {formatAnalysisJobTitle(job, index + 1)}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-1 break-all">
                          ID: {job.jobId}
                        </div>
                        {job.geneId ? (
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            Gene: {job.geneId}
                          </div>
                        ) : null}
                        {job.fromPosition != null &&
                          job.toPosition != null && (
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
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Results
                          </Button>
                        )}
                        {!["pending", "processing"].includes(job.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-2 w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                                disabled={deletingJobId === job.jobId}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {deletingJobId === job.jobId
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this job? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteJob(job.jobId);
                                  }}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
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

    </Layout>
  );
};
