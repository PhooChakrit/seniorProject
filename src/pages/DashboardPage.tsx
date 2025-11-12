import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Dna, Users, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Genome Assemblies',
      value: '12',
      icon: Dna,
      description: 'Active genome assemblies',
      color: 'text-blue-600',
    },
    {
      title: 'Data Sets',
      value: '48',
      icon: Database,
      description: 'Total datasets loaded',
      color: 'text-green-600',
    },
    {
      title: 'Active Users',
      value: '5',
      icon: Users,
      description: 'Collaborators online',
      color: 'text-purple-600',
    },
    {
      title: 'Analysis Tasks',
      value: '23',
      icon: Activity,
      description: 'Completed this month',
      color: 'text-orange-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || user?.email}!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your genomic data analysis platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for genome analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col space-y-2">
                <a
                  href="/jbrowse"
                  className="text-sm text-blue-600 hover:underline"
                >
                  → Open JBrowse Genome Browser
                </a>
                <a
                  href="/data"
                  className="text-sm text-blue-600 hover:underline"
                >
                  → Browse Genome Data
                </a>
                <span className="text-sm text-gray-500">
                  → Upload New Assembly (coming soon)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates in your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  • Human GRCh38 assembly loaded
                </p>
                <p className="text-muted-foreground">
                  • Variant analysis completed
                </p>
                <p className="text-muted-foreground">
                  • New annotation track added
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
