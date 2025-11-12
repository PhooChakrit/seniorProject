import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/common/Pagination';
import { genomeApi } from '@/api/genome';

export const DataPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['genomeData', currentPage, pageSize],
    queryFn: () => genomeApi.getGenomeData(currentPage, pageSize),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Genome Data</h2>
          <p className="text-muted-foreground">
            Browse and manage your genome datasets
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-red-500">
                Error loading data: {(error as Error).message}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {data?.data.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No genome data available. Add your first dataset to get started!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                data?.data.map((genome) => (
                  <Card key={genome.id}>
                    <CardHeader>
                      <CardTitle>{genome.name}</CardTitle>
                      <CardDescription>
                        Assembly: {genome.assembly}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {genome.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {genome.description}
                        </p>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Created: {new Date(genome.createdAt).toLocaleDateString()}
                        </span>
                        <span>ID: {genome.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {data && data.pagination.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={data.pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
