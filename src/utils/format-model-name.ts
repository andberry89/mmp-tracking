/** Remove the internal migration note from the canonical display name. */
export function formatModelName(name: string) {
  return name.replace(/\s*\(EQB replacement\)\s*$/i, "").trim();
}
