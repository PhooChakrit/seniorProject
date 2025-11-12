import apiClient from '@/lib/axios';
import { GenomeData, PaginatedResponse } from '@/types';

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
};
