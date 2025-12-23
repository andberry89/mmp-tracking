import { computed } from "vue";
import { compareDates } from "@/utils/helpers";
import type { DocumentsByStatus, TaskDocument, Author, GroupedAuthors } from "@/types";
import { PENDING_STATUSES, RTP_STATUSES, PUBLISHED_STATUSES } from "@/types";
import { getDocumentAuthor } from "@/utils";

export const sortDocuments = (docs: TaskDocument[]) => {
  // Filter by normalized status

  // Sort published: most recent publishedDate first
  let published = docs
    .filter((doc) => PUBLISHED_STATUSES.includes(doc.status))
    .sort((a, b) => compareDates(b.publishedDate, a.publishedDate));

  // Sort rtp: "Ready to Publish" and "Scheduled"
  let rtp = docs
    .filter((doc) => RTP_STATUSES.includes(doc.status))
    .sort((a, b) => {
      // Sort rtp: "Ready to Publish" before "Scheduled", then by embargoDate
      if (a.status === "rtp" && b.status === "scheduled") return -1;
      if (a.status === "scheduled" && b.status === "rtp") return 1;
      return compareDates(a.embargoDate, b.embargoDate);
    });

  let pending = docs
    .filter((doc) => PENDING_STATUSES.includes(doc.status))
    .sort((a, b) => compareDates(a.deadline, b.deadline));

  // Sort pending: assigned vs unassigned
  // → then by status
  // → then by team/name
  const teamOrder: Record<string, number> = { bg: 1, cd: 2, freelance: 3 };

  const assigned = pending
    .filter((doc) => getDocumentAuthor(doc))
    .sort((a, b) => {
      // Pending before RTE
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      const authorA = getDocumentAuthor(a);
      const authorB = getDocumentAuthor(b);

      if (!authorA || !authorB) return 0;

      // same status, sort by team then lastName
      const teamA = teamOrder[authorA.team.slug] ?? 99;
      const teamB = teamOrder[authorB.team.slug] ?? 99;

      if (teamA === teamB) {
        return authorA.lastName.localeCompare(authorB.lastName);
      }

      return teamA - teamB;
    });

  const unassigned = pending.filter((doc) => !getDocumentAuthor(doc));
  pending = [...unassigned, ...assigned];

  return { published, rtp, pending };
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
  let bg = authors.bg.filter((author) => author.active);
  let cd = authors.cd.filter((author) => author.active);
  let freelance = authors.freelance.filter((author) => author.active);
  return { bg: bg, cd: cd, freelance: freelance, all: [...bg, ...cd, ...freelance] };
};
