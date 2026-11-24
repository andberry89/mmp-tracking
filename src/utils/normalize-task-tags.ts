/** Trim event tags and remove blank or case-insensitive duplicates. */
export function normalizeTaskTags(tags: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawTag of tags ?? []) {
    const tag = rawTag.trim().slice(0, 50);
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
  }

  return normalized;
}
