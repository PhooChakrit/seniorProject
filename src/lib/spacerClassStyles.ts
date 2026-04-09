/** CRISPR-PLANT v2 specificity classes — shared badge / filter ordering. */

export const SPACER_CLASS_FILTER_ORDER: readonly string[] = [
  "A0",
  "A0.1",
  "A1",
  "A2",
  "B0",
  "B0.1",
  "B1",
  "B2",
  "Off-Target",
];

export function sortSpacerClassLabels(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    const ia = SPACER_CLASS_FILTER_ORDER.indexOf(a);
    const ib = SPACER_CLASS_FILTER_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Tailwind classes for class column badges (solid pills). */
export function spacerClassBadgeClassName(cls: string): string {
  const c = cls?.trim() ?? "";
  if (!c) return "border-transparent bg-muted text-muted-foreground";
  if (c.includes("Off-Target")) {
    return "border-transparent bg-red-600 text-white shadow-none dark:bg-red-700";
  }
  if (c === "A0.1" || c === "B0.1") {
    return "border-transparent bg-teal-600 text-white shadow-none dark:bg-teal-700";
  }
  if (c === "A0" || c === "B0") {
    return "border-transparent bg-emerald-600 text-white shadow-none dark:bg-emerald-700";
  }
  if (c.startsWith("A1") || c.startsWith("B1")) {
    return "border-transparent bg-amber-500 text-amber-950 shadow-none dark:bg-amber-400 dark:text-amber-950";
  }
  if (c.startsWith("A2") || c.startsWith("B2")) {
    return "border-transparent bg-orange-600 text-white shadow-none dark:bg-orange-700";
  }
  return "border-transparent bg-slate-500 text-white shadow-none dark:bg-slate-600";
}

/** Lighter chips for dense tables (e.g. genome browser modal). */
export function spacerClassSoftBadgeClassName(cls: string): string {
  const c = cls?.trim() ?? "";
  if (!c) return "bg-muted text-muted-foreground";
  if (c.includes("Off-Target")) {
    return "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100";
  }
  if (c === "A0.1" || c === "B0.1") {
    return "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100";
  }
  if (c === "A0" || c === "B0") {
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100";
  }
  if (c.startsWith("A1") || c.startsWith("B1")) {
    return "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100";
  }
  if (c.startsWith("A2") || c.startsWith("B2")) {
    return "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100";
  }
  return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100";
}
