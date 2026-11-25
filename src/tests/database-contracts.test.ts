import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const readRepoFile = (path: string) => readFileSync(`${repositoryRoot}/${path}`, "utf8");

describe("database import scripts", () => {
  it("keeps every Publication Tracking test batch independently runnable and transaction-wrapped", () => {
    const batchDirectory = `${repositoryRoot}/supabase/seeds/publication_tracking_test_batches`;
    const files = readdirSync(batchDirectory).filter((name) => /^\d{2}_.*\.sql$/.test(name)).sort();
    expect(files).toHaveLength(13);
    expect(files[0]).toBe("01_tasks.sql");
    expect(files.at(-1)).toBe("13_resources_and_date_cleanup.sql");

    for (const file of files) {
      const sql = readFileSync(`${batchDirectory}/${file}`, "utf8");
      expect(sql, file).toMatch(/\bbegin\s*;/i);
      expect(sql, file).toMatch(/commit\s*;\s*$/i);
      expect(sql, file).not.toMatch(/create\s+(?:temporary|temp)\s+table/i);
    }
  });

  it("keeps the event-tag migration self-contained and clears tags on publication", () => {
    const sql = readRepoFile("supabase/migrations/202611240003_mmp_task_event_tags.sql");
    expect(sql).toMatch(/alter table public\.mmp_tasks[\s\S]*add column if not exists tags text\[\]/i);
    expect(sql).toMatch(/new\.status in \('published', 'updated'\)[\s\S]*new\.tags := '\{\}'::text\[\]/i);
    expect(sql).toMatch(/tags\s*\n\s*from public\.mmp_tasks/i);
    expect(sql).toMatch(/if not public\.is_editor\(\)/i);
    expect(sql).not.toMatch(/create\s+(?:temporary|temp)\s+table/i);
  });

  it("keeps sensitive Rankings tables behind authenticated read and Editor write policies", () => {
    const sql = readRepoFile("supabase/migrations/202611050001_rankings_foundation.sql");
    expect(sql).toMatch(/alter table public\.model_year_vehicle_segments enable row level security/i);
    expect(sql).toMatch(/create policy "Authenticated users can read model-year segment entries"/i);
    expect(sql).toMatch(/create policy "Editors can manage model-year segment entries"[\s\S]*public\.is_editor\(\)/i);
    expect(sql).toMatch(/alter table public\.model_year_vehicle_awards enable row level security/i);
    expect(sql).toMatch(/create policy "Editors can manage model-year vehicle awards"[\s\S]*public\.is_editor\(\)/i);
  });
});
