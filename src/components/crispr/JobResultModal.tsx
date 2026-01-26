import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { searchApi, JobDetailResponse } from "@/api/search";
import { Loader2, CheckCircle2, XCircle, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobResultModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobResultModal: React.FC<JobResultModalProps> = ({
  jobId,
  open,
  onOpenChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && jobId) {
      fetchJobDetail();
    }
  }, [open, jobId]);

  const fetchJobDetail = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.getJobStatus(jobId);
      setJobDetail(response);
    } catch (err) {
      setError("Failed to fetch job details");
      console.error("Error fetching job detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (jobDetail?.result) {
      navigator.clipboard.writeText(JSON.stringify(jobDetail.result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadResult = () => {
    if (jobDetail?.result) {
      const dataStr = JSON.stringify(jobDetail.result, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-${jobId}-result.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getJobDescription = () => {
    if (!jobDetail) return "";
    if (jobDetail.type === "region_search") {
      return `${jobDetail.species} / ${jobDetail.chromosome}: ${jobDetail.fromPosition?.toLocaleString()}-${jobDetail.toPosition?.toLocaleString()}`;
    }
    return `${jobDetail.species} / Gene: ${jobDetail.geneId}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {jobDetail?.status === "completed" && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {jobDetail?.status === "failed" && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Job Result
          </DialogTitle>
          <DialogDescription>
            {loading ? "Loading..." : getJobDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          ) : jobDetail ? (
            <div className="space-y-4">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Job ID</p>
                  <p className="font-mono text-sm">{jobDetail.jobId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p
                    className={`font-semibold ${
                      jobDetail.status === "completed"
                        ? "text-green-600"
                        : jobDetail.status === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {jobDetail.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(jobDetail.createdAt)}</p>
                </div>
                {jobDetail.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-sm">
                      {formatDate(jobDetail.completedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {jobDetail.error && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Error
                  </p>
                  <p className="text-sm text-red-700">{jobDetail.error}</p>
                </div>
              )}

              {/* Result */}
              {jobDetail.result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Result</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyResult}
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadResult}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono max-h-[300px] overflow-y-auto">
                    {JSON.stringify(jobDetail.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* No result yet */}
              {!jobDetail.result &&
                !jobDetail.error &&
                jobDetail.status !== "completed" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Job is still processing...</p>
                    <p className="text-sm">
                      Results will be available when the job completes.
                    </p>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
