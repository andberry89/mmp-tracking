import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { Author, AuthorId, TaskDocument } from "@/types";
import { useAuthorsStore } from "@/stores/authors";
import { applyTaskRules } from "@/utils/apply-task-rules";
import { normalizeTaskTags } from "@/utils/normalize-task-tags";
import { sortAuthors, sortDocuments, getActiveAuthors } from "@/utils/sort-functions";

const author = (id: string, firstName: string, lastName: string, team: Author["team"]["slug"], active = true): Author => ({
  id: id as AuthorId,
  firstName,
  lastName,
  label: `${firstName} ${lastName}`,
  initials: `${firstName[0]}${lastName[0]}`.toUpperCase(),
  team: {
    slug: team,
    label: team === "bg" ? "Buyer's Guide" : team === "cd" ? "Car and Driver" : "Freelance",
    sidebar: team === "bg" ? "B/G Staff" : team === "cd" ? "C/D Staff" : "Freelancers",
  },
  active,
});

const task = (overrides: Partial<TaskDocument> = {}): TaskDocument => ({
  id: "task",
  highPriority: false,
  vehicle: { make: "Acme", model: "Model", segment: "Cars", modelYear: 2027 },
  authorId: null,
  deadline: "",
  status: "pending",
  notes: "",
  assets: [],
  embargoDate: "",
  embargoNotes: "",
  embargo: false,
  published: false,
  new: true,
  publishedDate: "",
  ...overrides,
});

describe("publication lifecycle rules", () => {
  it.each(["published", "updated"] as const)("keeps a %s task in published history", (status) => {
    const input = task({ status, publishedDate: "2026-11-24T15:30:00Z" });

    expect(applyTaskRules(input)).toMatchObject({
      status,
      published: true,
      publishedDate: "2026-11-24T15:30:00Z",
    });
  });

  it("clears publication date and flag when a task returns to active work", () => {
    const input = task({ status: "rtp", published: true, publishedDate: "2026-11-24T15:30:00Z" });

    expect(applyTaskRules(input)).toMatchObject({
      status: "rtp",
      published: false,
      publishedDate: "",
    });
  });

  it("makes Scheduled imply embargo and supplies the default note only when blank", () => {
    expect(applyTaskRules(task({ status: "scheduled" }))).toMatchObject({
      embargo: true,
      notes: "Scheduled for embargo time",
    });
    expect(applyTaskRules(task({ status: "scheduled", notes: "Launch timing confirmed" })).notes)
      .toBe("Launch timing confirmed");
  });

  it("normalizes optional collections and does not mutate the input", () => {
    const input = task({ status: "pending", assets: undefined as unknown as TaskDocument["assets"] });
    const result = applyTaskRules(input);

    expect(result.assets).toEqual([]);
    expect(result.notes).toBe("");
    expect(input.assets).toBeUndefined();
  });

  it("normalizes task tags and clears them on publication", () => {
    const input = task({ status: "pending", tags: ["  New York Auto Show ", "new york auto show", "", "Pebble Beach"] });
    expect(applyTaskRules(input).tags).toEqual(["New York Auto Show", "Pebble Beach"]);
    expect(applyTaskRules({ ...input, status: "published" }).tags).toEqual([]);
    expect(normalizeTaskTags(["a".repeat(55)])).toEqual(["a".repeat(50)]);
  });
});

describe("task list ordering", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useAuthorsStore().upsertAuthors([
      author("austin", "Austin", "Parsons", "bg"),
      author("drew", "Drew", "Dorian", "bg"),
      author("eric", "Eric", "Stafford", "cd"),
      author("beth", "Beth", "Nichols", "freelance"),
    ]);
  });

  it("groups published and updated together, newest first, with undated entries last", () => {
    const input = [
      task({ id: "old", status: "published", publishedDate: "2026-11-20T12:00:00Z" }),
      task({ id: "undated", status: "updated", publishedDate: "" }),
      task({ id: "new", status: "updated", publishedDate: "2026-11-24T12:00:00Z" }),
      task({ id: "active", status: "pending" }),
    ];

    expect(sortDocuments(input).published.map(({ id }) => id)).toEqual(["new", "old", "undated"]);
    expect(input.map(({ id }) => id)).toEqual(["old", "undated", "new", "active"]);
  });

  it("keeps Ready to Publish ahead of Scheduled", () => {
    const sorted = sortDocuments([
      task({ id: "scheduled", status: "scheduled", embargoDate: "2026-11-20T10:00:00Z" }),
      task({ id: "rtp", status: "rtp" }),
    ]);

    expect(sorted.rtp.map(({ id }) => id)).toEqual(["rtp", "scheduled"]);
  });

  it("puts unassigned tasks first, then groups authors by team and name, then sorts each author's deadlines", () => {
    const sorted = sortDocuments([
      task({ id: "freelance", authorId: "beth" as AuthorId }),
      task({ id: "cd", authorId: "eric" as AuthorId }),
      task({ id: "parsons-late", authorId: "austin" as AuthorId, deadline: "2026-12-10", vehicle: { make: "Acme", model: "Zed", segment: "Cars", modelYear: 2027 } }),
      task({ id: "dorian", authorId: "drew" as AuthorId }),
      task({ id: "unassigned", authorId: null }),
      task({ id: "parsons-undated-z", authorId: "austin" as AuthorId, vehicle: { make: "Acme", model: "Zed", segment: "Cars", modelYear: 2027 } }),
      task({ id: "parsons-early", authorId: "austin" as AuthorId, deadline: "2026-11-25" }),
      task({ id: "parsons-undated-a", authorId: "austin" as AuthorId, vehicle: { make: "Acme", model: "Alpha", segment: "Cars", modelYear: 2027 } }),
    ]);

    expect(sorted.pending.map(({ id }) => id)).toEqual([
      "unassigned",
      "dorian",
      "parsons-early",
      "parsons-late",
      "parsons-undated-a",
      "parsons-undated-z",
      "cd",
      "freelance",
    ]);
  });
});

describe("author grouping", () => {
  it("sorts authors by team order then last name, and keeps inactive authors out of active groups", () => {
    const grouped = sortAuthors([
      author("freelance", "Beth", "Nichols", "freelance"),
      author("cd", "Eric", "Stafford", "cd"),
      author("bg-z", "Austin", "Parsons", "bg"),
      author("bg-a", "Drew", "Dorian", "bg"),
      author("inactive", "Former", "Writer", "bg", false),
    ]);

    expect(grouped.all.map(({ id }) => id)).toEqual(["bg-a", "bg-z", "inactive", "cd", "freelance"]);
    expect(getActiveAuthors(grouped).all.map(({ id }) => id)).toEqual([
      "bg-a",
      "bg-z",
      "cd",
      "freelance",
    ]);
  });
});
