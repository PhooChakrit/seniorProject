export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Species and Chromosome types
export interface Chromosome {
  id: string;
  label: string;
}

export interface Species {
  name: string;
  label: string;
  genomeFile: string;
  chromosomes: Chromosome[];
}

export interface SpeciesData {
  [key: string]: Species;
}

// JBrowse genome config (mirrors GenomeConfig Prisma model)
export interface JBrowseGenomeConfig {
  id: number;
  key: string;
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assemblyConfig: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tracks: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultSession: any;
  defaultLocation: string;
  assemblyName: string;
  cultivarType: string;
  tracksLoaded: string;
  defaultRegion: string;
  specialFeatures: string;
}

export interface AnalysisVariety {
  id: string;
  label: string;
  defaultContig: string;
  contigs: string[];
  warnings: string[];
}

// Search types
export interface RegionSearchParams {
  species: string;
  chromosome: string;
  fromPosition: number;
  toPosition: number;
}

export interface GeneSearchParams {
  species: string;
  geneId: string;
}

export interface SearchResult {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  type: "region_search" | "gene_search";
  params: RegionSearchParams | GeneSearchParams;
  result?: {
    sequences?: string[];
    genes?: string[];
    crisprTargets?: Array<{
      sequence: string;
      position: number;
      strand: "+" | "-";
      pamSequence: string;
    }>;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SearchJobResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
  // For direct responses (Gene Search)
  gene?: {
    id: string;
    symbol?: string;
    chromosome: string;
    start: number;
    end: number;
    strand: string;
    description?: string;
  };
  spacers?: any[]; // Keep any for flexibility, or define Spacer type
}
