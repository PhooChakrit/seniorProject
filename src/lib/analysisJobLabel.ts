/** Build a short human-readable label for analysis job history (Thai + keys). */

export interface AnalysisJobListFields {
  jobId: string;
  type?: string | null;
  species?: string | null;
  chromosome?: string | null;
  fromPosition?: number | null;
  toPosition?: number | null;
  geneId?: string | null;
}

/** Last segment of analysis_<ts>_<rand>, truncated — disambiguates duplicate regions. */
export function jobIdShortSuffix(jobId: string, maxLen = 7): string {
  const parts = jobId.split("_");
  const tail = parts[parts.length - 1] || jobId;
  return tail.slice(0, maxLen);
}

/**
 * @param indexOneBased — 1 = newest in the current list (top card).
 */
export function formatAnalysisJobTitle(
  job: AnalysisJobListFields,
  indexOneBased: number,
): string {
  const variety = (job.species || "unknown").trim() || "unknown";
  const suffix = jobIdShortSuffix(job.jobId);
  const n = indexOneBased;

  if (job.type === "gene_region_analysis" && job.geneId?.trim()) {
    const g = job.geneId.trim();
    const geneShort = g.length > 28 ? `${g.slice(0, 26)}…` : g;
    return `${n}_${variety}_ยีน-${geneShort}_${suffix}`;
  }

  const from = job.fromPosition;
  const to = job.toPosition;
  if (from != null && to != null) {
    const chr = (job.chromosome || "").trim();
    const loc = chr ? `${chr}_${from}-${to}` : `${from}-${to}`;
    return `${n}_${variety}_${loc}_${suffix}`;
  }

  return `${n}_${variety}_${suffix}`;
}
