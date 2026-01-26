import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SearchForm } from "@/components/crispr";
import { JobStatusList } from "@/components/crispr/JobStatusList";
import { JobResultModal } from "@/components/crispr/JobResultModal";

export const SearchPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearchSubmit = (
    jobId: string,
    mode: "region" | "gene",
    status?: string,
  ) => {
    console.log(
      "Search job submitted:",
      jobId,
      "Mode:",
      mode,
      "Status:",
      status,
    );
    // Trigger refresh of job list
    setRefreshKey((prev) => prev + 1);

    // If instant complete (Gene Search found in DB), open modal immediately
    if (status === "completed") {
      setSelectedJobId(jobId);
      setModalOpen(true);
    }
  };

  const handleViewResult = (jobId: string) => {
    setSelectedJobId(jobId);
    setModalOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Genome Search</h1>
          <p className="text-lg text-muted-foreground">
            ค้นหา genome data ด้วย region หรือ gene ID
          </p>
        </div>

        {/* Search Form */}
        <SearchForm onSearchSubmit={handleSearchSubmit} />

        {/* Job Status List */}
        {/* <JobStatusList
          key={refreshKey}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
          onViewResult={handleViewResult}
        /> */}

        {/* Instructions */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">วิธีใช้งาน</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>Search by Region:</strong> เลือก species, chromosome
              และระบุ position (from/to)
            </li>
            <li>
              <strong>Search by Gene ID:</strong> เลือก species และใส่ gene ID
              เช่น AT1G01010, LOC_Os01g53090
            </li>
            <li>
              หลังกด Search ระบบจะส่ง job ไป worker ดูสถานะได้ที่ Job Status
              ด้านบน
            </li>
            <li>
              Auto-refresh จะอัปเดตสถานะทุก 3 วินาที (เมื่อมี job ที่กำลังทำงาน)
            </li>
          </ul>
        </div>
      </div>

      <JobResultModal
        jobId={selectedJobId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Layout>
  );
};
