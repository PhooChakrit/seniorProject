import apiClient from '@/lib/axios';
import { AnalysisVariety, GenomeData, JBrowseGenomeConfig, PaginatedResponse } from '@/types';

export const genomeApi = {
  getGenomeData: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<GenomeData>> => {
    const { data } = await apiClient.get<PaginatedResponse<GenomeData>>('/genome', {
      params: { page, limit },
    });
    return data;
  },

  getGenomeById: async (id: number): Promise<GenomeData> => {
    const { data } = await apiClient.get<GenomeData>(`/genome/${id}`);
    return data;
  },

  createGenomeData: async (genomeData: Omit<GenomeData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<GenomeData> => {
    const { data } = await apiClient.post<GenomeData>('/genome', genomeData);
    return data;
  },

  getGenomeConfigs: async (): Promise<JBrowseGenomeConfig[]> => {
    const { data } = await apiClient.get<JBrowseGenomeConfig[]>('/genome/configs');
    return data;
  },

  getAnalysisVarieties: async (): Promise<AnalysisVariety[]> => {
    const { data } = await apiClient.get<{ varieties: AnalysisVariety[] }>('/analysis/varieties');
    return data.varieties;
  },
};
