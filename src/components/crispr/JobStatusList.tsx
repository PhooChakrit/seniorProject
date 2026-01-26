import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { searchApi, JobListItem } from "@/api/search";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { JobResultModal } from "./JobResultModal";

interface JobStatusListProps {
  onRefresh?: () => void;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${colors[status] || "bg-gray-100"}`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  );
};

export const JobStatusList: React.FC<JobStatusListProps> = ({ onRefresh }) => {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      setError(null);
      const response = await searchApi.getJobList(1, 20);
      setJobs(response.jobs);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Auto-refresh every 3 seconds if there are pending/processing jobs
  useEffect(() => {
    if (!autoRefresh) return;

    const hasPendingJobs = jobs.some(
      (job) => job.status === "pending" || job.status === "processing",
    );

    if (!hasPendingJobs) return;

    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [jobs, autoRefresh]);

  const handleRefresh = () => {
    setLoading(true);
    fetchJobs();
    onRefresh?.();
  };

  const handleViewResult = (jobId: string) => {
    setSelectedJobId(jobId);
    setModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getJobDescription = (job: JobListItem) => {
    if (job.type === "region_search") {
      return `${job.species} / ${job.chromosome}: ${job.fromPosition?.toLocaleString()}-${job.toPosition?.toLocaleString()}`;
    } else {
      return `${job.species} / Gene: ${job.geneId}`;
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Job Status</CardTitle>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No jobs yet. Submit a search to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewResult(job.jobId)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} />
                    <span className="text-sm font-medium">
                      {job.type === "region_search"
                        ? "Region Search"
                        : "Gene Search"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getJobDescription(job)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(job.createdAt)}
                    {job.completedAt &&
                      ` • Completed: ${formatDate(job.completedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {job.error && (
                    <div className="text-xs text-red-500 max-w-xs truncate">
                      {job.error}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewResult(job.jobId);
                    }}
                    title="View Result"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <JobResultModal
        jobId={selectedJobId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Card>
  );
};
