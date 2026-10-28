import type { AuthorId, TaskDocument, TaskAsset } from "@/types";
import { supabase } from "@/lib/supabase";

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryBuilder<T> extends PromiseLike<QueryResult<T>> {
  select(columns: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
}

interface QueryClient {
  from(table: string): QueryBuilder<unknown[]>;
}

interface DbAuthor {
  id: string;
  first_name: string;
  last_name: string;
  label: string;
  initials: string;
  team: "bg" | "cd" | "freelance";
  active: boolean;
}

interface DbTaskResource {
  id: string;
  kind: "imeet" | "material";
  label: string;
  url: string;
  notes: string;
}

interface DbTask {
  id: string;
  model_year_vehicle_id: string;
  author_id: string | null;
  status: "pending" | "pending_edits" | "rtp" | "scheduled" | "published" | "updated";
  task_kind: "new_mmp" | "update";
  high_priority: boolean;
  deadline: string | null;
  notes: string;
  embargo_at: string | null;
  embargo_notes: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  model_year_vehicles: {
    id: string;
    model_year: number;
    segments: { name: string } | null;
    models: {
      name: string;
      makes: { name: string };
    };
  };
  task_resources: DbTaskResource[];
}

const authorTeams = {
  bg: { slug: "bg", label: "Buyer's Guide", sidebar: "BG" },
  cd: { slug: "cd", label: "Car and Driver", sidebar: "C/D" },
  freelance: { slug: "freelance", label: "Freelancers", sidebar: "FL" },
} as const;

export async function fetchAuthors() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const result = (await (supabase as unknown as QueryClient)
    .from("authors")
    .select("id, first_name, last_name, label, initials, team, active")
    .order("last_name", { ascending: true })) as QueryResult<unknown[]>;

  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []) as DbAuthor[];
  return rows.map((row) => ({
    id: row.id as AuthorId,
    firstName: row.first_name,
    lastName: row.last_name,
    label: row.label,
    initials: row.initials,
    team: authorTeams[row.team],
    active: row.active,
  }));
}

export async function fetchTasks(): Promise<TaskDocument[]> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const columns = [
    "id",
    "model_year_vehicle_id",
    "author_id",
    "status",
    "task_kind",
    "high_priority",
    "deadline",
    "notes",
    "embargo_at",
    "embargo_notes",
    "published_at",
    "created_at",
    "updated_at",
    "model_year_vehicles!inner(id, model_year, segments(name), models!inner(name, makes!inner(name)))",
    "task_resources(id, kind, label, url, notes)",
  ].join(",");

  const result = (await (supabase as unknown as QueryClient)
    .from("mmp_tasks")
    .select(columns)
    .order("created_at", { ascending: false })) as QueryResult<unknown[]>;

  if (result.error) throw new Error(result.error.message);

  return ((result.data ?? []) as DbTask[]).map((row) => {
    const status = row.status === "pending_edits" ? "rte" : row.status;
    const assets: TaskAsset[] = row.task_resources.map((resource) => ({
      id: resource.id,
      kind: resource.kind,
      label: resource.label,
      url: resource.url,
      notes: resource.notes,
    }));

    return {
      id: row.id,
      modelYearVehicleId: row.model_year_vehicle_id,
      createdDate: row.created_at,
      updatedDate: [row.updated_at],
      highPriority: row.high_priority,
      vehicle: {
        make: row.model_year_vehicles.models.makes.name,
        model: row.model_year_vehicles.models.name,
        segment: row.model_year_vehicles.segments?.name ?? "",
        modelYear: row.model_year_vehicles.model_year,
      },
      authorId: row.author_id as AuthorId | null,
      deadline: row.deadline ?? "",
      status,
      notes: row.notes,
      assets,
      embargoDate: row.embargo_at ?? "",
      embargoNotes: row.embargo_notes,
      embargo: Boolean(row.embargo_at),
      published: row.status === "published" || row.status === "updated",
      new: row.task_kind === "new_mmp",
      publishedDate: row.published_at ?? "",
    };
  });
}
