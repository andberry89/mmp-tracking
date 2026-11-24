import { compareDates } from "@/utils/helpers";
import type { TaskDocument, Author, GroupedAuthors, TaskStatus } from "@/types";
import { PENDING_STATUSES, RTP_STATUSES, PUBLISHED_STATUSES } from "@/types";
import { getDocumentAuthor } from "@/utils";

export const sortDocuments = (docs: TaskDocument[]) => {
  // Sort published: most recent publishedDate first
  const published = docs
    .filter((doc) => (PUBLISHED_STATUSES as readonly TaskStatus[]).includes(doc.status))
    .sort((a, b) => {
      const timeA = a.publishedDate ? new Date(a.publishedDate).getTime() : Number.NaN;
      const timeB = b.publishedDate ? new Date(b.publishedDate).getTime() : Number.NaN;
      const hasDateA = Number.isFinite(timeA);
      const hasDateB = Number.isFinite(timeB);

      if (!hasDateA && hasDateB) return 1;
      if (hasDateA && !hasDateB) return -1;
      if (!hasDateA || !hasDateB) return 0;
      return timeB - timeA;
    });

  // Sort rtp: "Ready to Publish" and "Scheduled"
  const rtp = docs
    .filter((doc) => (RTP_STATUSES as readonly TaskStatus[]).includes(doc.status))
    .sort((a, b) => {
      // Sort rtp: "Ready to Publish" before "Scheduled", then by embargoDate
      if (a.status === "rtp" && b.status === "scheduled") return -1;
      if (a.status === "scheduled" && b.status === "rtp") return 1;
      return compareDates(a.embargoDate, b.embargoDate);
    });

  const pending = docs.filter((doc) =>
    (PENDING_STATUSES as readonly TaskStatus[]).includes(doc.status)
  );

  // Keep unassigned tasks together first. Then group assigned work by team
  // and author, sorting each author's dated tasks by deadline and undated
  // tasks alphabetically by vehicle.
  const teamOrder: Record<string, number> = { bg: 1, cd: 2, freelance: 3 };
  const authorByTaskId = new Map(
    pending.map((doc) => [doc.id, getDocumentAuthor(doc)] as const)
  );
  const authorFor = (doc: TaskDocument) => authorByTaskId.get(doc.id) ?? null;
  const compareVehicle = (a: TaskDocument, b: TaskDocument) =>
    `${a.vehicle.make} ${a.vehicle.model}`.localeCompare(
      `${b.vehicle.make} ${b.vehicle.model}`,
      undefined,
      { sensitivity: "base", numeric: true }
    );
  const compareDeadlineThenVehicle = (a: TaskDocument, b: TaskDocument) => {
    const deadlineA = a.deadline?.trim() ?? "";
    const deadlineB = b.deadline?.trim() ?? "";
    if (deadlineA && !deadlineB) return -1;
    if (!deadlineA && deadlineB) return 1;
    if (deadlineA && deadlineB) {
      const byDeadline = deadlineA.localeCompare(deadlineB);
      if (byDeadline) return byDeadline;
    }
    return compareVehicle(a, b);
  };

  const assigned = pending
    .filter((doc) => authorFor(doc))
    .sort((a, b) => {
      const authorA = authorFor(a);
      const authorB = authorFor(b);

      if (!authorA || !authorB) return 0;

      const teamA = teamOrder[authorA.team.slug] ?? 99;
      const teamB = teamOrder[authorB.team.slug] ?? 99;
      if (teamA !== teamB) return teamA - teamB;

      const byLastName = authorA.lastName.localeCompare(authorB.lastName, undefined, {
        sensitivity: "base",
      });
      if (byLastName) return byLastName;

      const byFirstName = authorA.firstName.localeCompare(authorB.firstName, undefined, {
        sensitivity: "base",
      });
      if (byFirstName) return byFirstName;

      return compareDeadlineThenVehicle(a, b);
    });

  const unassigned = pending
    .filter((doc) => !authorFor(doc))
    .sort(compareDeadlineThenVehicle);
  const sortedPending = [...unassigned, ...assigned];

  return { published, rtp, pending: sortedPending };
};

export const sortAuthors = (authors: Author[]): GroupedAuthors => {
  // Separate authors by team
  const bg = authors.filter((author) => author.team.slug === "bg");
  const cd = authors.filter((author) => author.team.slug === "cd");
  const freelance = authors.filter((author) => author.team.slug === "freelance");

  // Sort each team alphabetically by last name
  bg.sort((a, b) => a.lastName.localeCompare(b.lastName));
  cd.sort((a, b) => a.lastName.localeCompare(b.lastName));
  freelance.sort((a, b) => a.lastName.localeCompare(b.lastName));

  // Combine sorted arrays
  return {
    bg: bg,
    cd: cd,
    freelance: freelance,
    all: [...bg, ...cd, ...freelance],
  };
};

export const getActiveAuthors = (authors: GroupedAuthors): GroupedAuthors => {
  const bg = authors.bg.filter((author) => author.active);
  const cd = authors.cd.filter((author) => author.active);
  const freelance = authors.freelance.filter((author) => author.active);
  return { bg: bg, cd: cd, freelance: freelance, all: [...bg, ...cd, ...freelance] };
};
