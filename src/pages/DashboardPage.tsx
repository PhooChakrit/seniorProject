import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dna,
  Clock3,
  Activity,
  ArrowRight,
  BookOpen,
  Microscope,
  FlaskConical,
} from "lucide-react";
import { genomeApi } from "@/api/genome";
import apiClient from "@/lib/axios";

interface AnalysisJobsResponse {
  completedThisMonth: number;
  queueWaiting?: number;
}

export const DashboardPage: React.FC = () => {


  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [genomeConfigs, summaryRes] = await Promise.all([
        genomeApi.getGenomeConfigs(),
        apiClient.get<AnalysisJobsResponse>("/analysis/public-summary"),
      ]);

      return {
        genomeAssemblies: genomeConfigs.length,
        queueWaiting: summaryRes.data.queueWaiting ?? 0,
        completedThisMonth: summaryRes.data.completedThisMonth ?? 0,
      };
    },
  });

  const stats = [
    {
      title: "Genome Assemblies",
      value: isLoading ? "..." : String(data?.genomeAssemblies ?? 0),
      icon: Dna,
      description: "Assemblies currently available in the platform",
      color: "text-blue-600",
    },
    {
      title: "Queue Waiting",
      value: isLoading ? "..." : String(data?.queueWaiting ?? 0),
      icon: Clock3,
      description: "Jobs waiting in worker queue",
      color: "text-purple-600",
    },
    {
      title: "Analysis Tasks",
      value: isLoading ? "..." : String(data?.completedThisMonth ?? 0),
      icon: Activity,
      description: "Completed this month",
      color: "text-orange-600",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 text-white shadow-sm">
          <h2 className="mt-2 text-3xl font-bold tracking-tight">CU POWER Grant Dashboard</h2>
          {/* <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || user?.email}
          </h2> */}
          <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
            Platform for Food Plant Gene Editing - project overview and the latest platform usage statistics.
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">
              CU POWER Grant Funding Support for University Units, Round 2,
              Fiscal Year 2025
            </CardTitle>
            <CardDescription className="text-sm">
              Project: Platform for Food Plant Gene Editing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-slate-700">
            <p>
              The university provides strategic project funding at the faculty,
              institute, and unit levels in alignment with university strategy
              under the CU POWER Grant program, which started in fiscal year
              2025.
            </p>
            <p className="text-xs text-slate-600">
              The statistics below are pulled from live system data in real
              time.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-sm transition hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className="rounded-lg bg-slate-100 p-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for genome analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Link
                  to="/jbrowse"
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition hover:bg-blue-50"
                >
                  <span>Open JBrowse Genome Browser</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>
                <Link
                  to="/analysis"
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition hover:bg-blue-50"
                >
                  <span>Run Custom Analysis</span>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Project Focus</CardTitle>
              <CardDescription>
                Key outcomes under CU POWER Grant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <BookOpen className="mt-0.5 h-4 w-4 text-blue-600" />
                <p>
                  Build knowledge and genome data resources for food plants to
                  support research.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Microscope className="mt-0.5 h-4 w-4 text-purple-600" />
                <p>
                  Integrate analysis workflows with genomics tools for seamless
                  end-to-end operations.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <FlaskConical className="mt-0.5 h-4 w-4 text-orange-600" />
                <p>
                  Advance the platform to support applied food-plant gene
                  editing use cases.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
