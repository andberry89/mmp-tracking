import type { AuthorId, TaskDocument, TaskAsset } from "@/types";
import { supabase } from "@/lib/supabase";
import { formatModelName } from "@/utils/format-model-name";

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryBuilder<T> extends PromiseLike<QueryResult<T>> {
  select(columns: string): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  range(from: number, to: number): QueryBuilder<T>;
  in(column: string, values: string[]): QueryBuilder<T>;
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
    model_year_vehicle_segments?: Array<{ segments: { name: string } | { name: string }[] | null }>;
    segments?: { name: string } | null;
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

const taskColumns = [
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
  "model_year_vehicles!inner(id, model_year, model_year_vehicle_segments(segments(name)), models!inner(name, makes!inner(name)))",
  "task_resources(id, kind, label, url, notes)",
].join(",");

export async function fetchTasks(): Promise<TaskDocument[]> {
  return (await fetchTaskRows({ column: "status", values: ["pending", "pending_edits", "rtp", "scheduled"] })).map(mapTask);
}

export interface PublishedTaskPage {
  items: TaskDocument[];
  totalCount: number;
}

interface PublishedTaskPageRow extends Omit<DbTask, "status"> {
  status: "published" | "updated";
}

export async function fetchPublishedTaskPage(input: {
  page: number;
  pageSize: number;
  startAt: string | null;
  endAt: string | null;
  authorId: string | null;
  query: string;
}): Promise<PublishedTaskPage> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_published_task_page", {
    p_page: input.page,
    p_page_size: input.pageSize,
    p_start_at: input.startAt,
    p_end_at: input.endAt,
    p_author_id: input.authorId,
    p_query: input.query || null,
  });
  if (error) throw new Error(error.message);
  const result = data as { items?: PublishedTaskPageRow[]; total_count?: number } | null;
  return {
    items: (result?.items ?? []).map(mapTask),
    totalCount: Number(result?.total_count ?? 0),
  };
}

export interface PublishedTaskStat {
  status: "published" | "updated";
  modelYear: number;
  count: number;
}

export async function fetchPublishedTaskStats(startAt: string | null, endAt: string | null): Promise<PublishedTaskStat[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_published_task_stats", {
    p_start_at: startAt,
    p_end_at: endAt,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ status: "published" | "updated"; model_year: number; task_count: number }>).map((row) => ({
    status: row.status,
    modelYear: row.model_year,
    count: Number(row.task_count),
  }));
}

export async function fetchTaskById(taskId: string): Promise<TaskDocument | null> {
  const rows = await fetchTaskRows({ column: "id", value: taskId });
  return rows[0] ? mapTask(rows[0]) : null;
}

export async function fetchTasksForVehicle(vehicleId: string): Promise<TaskDocument[]> {
  const rows = await fetchTaskRows({ column: "model_year_vehicle_id", value: vehicleId });
  return rows.map(mapTask);
}

async function fetchTaskRows(filter?: { column: "id" | "model_year_vehicle_id"; value: string } | { column: "status"; values: string[] }) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const client = supabase;

  return fetchAllPages((from, to) => {
    let query = (client as unknown as QueryClient)
      .from("mmp_tasks")
      .select(taskColumns);
    if (filter && "value" in filter) query = query.eq(filter.column, filter.value);
    if (filter && "values" in filter) query = query.in(filter.column, filter.values);
    return query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);
  }) as Promise<DbTask[]>;
}

export function mapTask(row: DbTask): TaskDocument {
  const status = row.status === "pending_edits" ? "rte" : row.status;
  const assets: TaskAsset[] = row.task_resources.map((resource) => ({
    id: resource.id,
    kind: resource.kind,
    label: resource.label,
    url: resource.url,
    notes: resource.notes,
  }));
  const segments = row.model_year_vehicles.model_year_vehicle_segments
    ? row.model_year_vehicles.model_year_vehicle_segments
      .flatMap((assignment) => Array.isArray(assignment.segments) ? assignment.segments : assignment.segments ? [assignment.segments] : [])
      .map((segment) => segment.name)
    : row.model_year_vehicles.segments?.name ? [row.model_year_vehicles.segments.name] : [];

  return {
    id: row.id,
    modelYearVehicleId: row.model_year_vehicle_id,
    createdDate: row.created_at,
    updatedDate: [row.updated_at],
    highPriority: row.high_priority,
    vehicle: {
      make: row.model_year_vehicles.models.makes.name,
      model: formatModelName(row.model_year_vehicles.models.name),
      segment: segments.join(", "),
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
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<QueryResult<T[]>>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const result = await fetchPage(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
