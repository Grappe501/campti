/**
 * Normalization for census OCR rows — stable uppercase, diacritic-stripped keys for search and AI assembly.
 */

export function normalizeCensusLabel(input: string | null | undefined): string {
  if (input == null || !String(input).trim()) return "";
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
