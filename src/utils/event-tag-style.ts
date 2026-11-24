/** Return a soft, repeatable color set for an event tag across the app. */
export function getEventTagStyle(tag: string): Record<string, string> {
  let hash = 2166136261;
  for (const character of tag.trim().toLowerCase()) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  const hue = (hash >>> 0) % 360;
  return {
    "--event-tag-background": `hsl(${hue} 58% 94%)`,
    "--event-tag-border": `hsl(${hue} 40% 76%)`,
    "--event-tag-text": `hsl(${hue} 48% 29%)`,
  };
}
