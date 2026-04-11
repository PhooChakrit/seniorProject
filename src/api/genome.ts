import apiClient from '@/lib/axios';
import { AnalysisVariety, JBrowseGenomeConfig } from '@/types';

export const genomeApi = {
  getGenomeConfigs: async (): Promise<JBrowseGenomeConfig[]> => {
    const { data } = await apiClient.get<JBrowseGenomeConfig[]>('/genome/configs');
    return data;
  },

  getAnalysisVarieties: async (): Promise<AnalysisVariety[]> => {
    const { data } = await apiClient.get<{ varieties: AnalysisVariety[] }>('/analysis/varieties');
    return data.varieties;
  },
};
