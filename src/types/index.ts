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

export interface GenomeData {
  id: number;
  name: string;
  assembly: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
