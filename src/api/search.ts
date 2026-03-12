import apiClient from '@/lib/axios';
import { RegionSearchParams, GeneSearchParams, SearchJobResponse } from '@/types';

export interface JobListItem {
  id: string;
  jobId: string;
  type: 'region_search' | 'gene_search';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  species: string;
  chromosome?: string;
  fromPosition?: number;
  toPosition?: number;
  geneId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface JobListResponse {
  jobs: JobListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobDetailResponse extends JobListItem {
  result?: Record<string, unknown>;
}

export const searchApi = {
  /**
   * Search by genomic region (chromosome + positions)
   */
  searchByRegion: async (params: RegionSearchParams): Promise<SearchJobResponse> => {
    const { data } = await apiClient.post<SearchJobResponse>('/genome/search/region', params);
    return data;
  },

  /**
   * Search by gene ID or gene symbol
   */
  searchByGene: async (params: GeneSearchParams): Promise<SearchJobResponse> => {
    const { data } = await apiClient.post<SearchJobResponse>('/genome/search/gene', params);
    return data;
  },

  /**
   * Get user's job list
   */
  getJobList: async (page: number = 1, limit: number = 10): Promise<JobListResponse> => {
    const { data } = await apiClient.get<JobListResponse>('/genome/jobs', {
      params: { page, limit },
    });
    return data;
  },

  /**
   * Get job status and result
   */
  getJobStatus: async (jobId: string): Promise<JobDetailResponse> => {
    const { data } = await apiClient.get<JobDetailResponse>(`/genome/search/status/${jobId}`);
    return data;
  },
};

