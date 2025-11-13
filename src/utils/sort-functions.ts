import { compareDates, normalizeStatus } from "@/utils/helpers";
import type { DocumentsByStatus, TaskDocument } from "@/types";

export const sortDocuments = (docs) => {
  // Filter by normalized status

  // Sort published: most recent publishedDate first
  let published = docs
    .filter((doc) => doc.published || normalizeStatus(doc.status) === "Published")
    .sort((a, b) => compareDates(b.publishedDate, a.publishedDate));

  // Sort rtp: "Ready to Publish" and "Scheduled"
  let rtp = docs
    .filter((doc) => {
      const status = normalizeStatus(doc.status);
      return (!doc.published && status === "Ready to Publish") || status === "Scheduled";
    })
    .sort((a, b) => {
      // Sort rtp: "Ready to Publish" before "Scheduled", then by embargoDate
      const aStatus = normalizeStatus(a.status);
      const bStatus = normalizeStatus(b.status);
      if (aStatus === "Ready to Publish" && bStatus !== "Ready to Publish") return -1;
      if (aStatus !== "Ready to Publish" && bStatus === "Ready to Publish") return 1;
      return compareDates(a.embargoDate, b.embargoDate);
    });

  let pending = docs
    .filter((doc) => {
      const status = normalizeStatus(doc.status);
      return !doc.published && status !== "Ready to Publish" && status !== "Scheduled";
    })
    .sort((a, b) => compareDates(a.deadline, b.deadline));

  // Sort pending: assigned vs unassigned → then by status → then by team/name
  const assigned = pending
    .filter((doc) => doc.author)
    .sort((a, b) => {
      const aStatus = normalizeStatus(a.status);
      const bStatus = normalizeStatus(b.status);

      if (aStatus === "Pending" && bStatus !== "Pending") return -1;
      if (aStatus !== "Pending" && bStatus === "Pending") return 1;

      // same status, sort by team then lastName
      const teamOrder: Record<string, number> = { bg: 1, cd: 2, freelance: 3 };
      const teamA = teamOrder[a.author.team.slug] ?? 99;
      const teamB = teamOrder[b.author.team.slug] ?? 99;

      if (teamA === teamB) {
        return a.author.lastName.localeCompare(b.author.lastName);
      }

      return teamA - teamB;
    });

  const unassigned = pending.filter((doc) => !doc.author);
  pending = [...unassigned, ...assigned];

  return { published, rtp, pending };
};

export const sortAuthors = (authors) => {
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

export const getActiveAuthors = (authors) => {
  let bg = authors.bg.filter((author) => author.active);
  let cd = authors.cd.filter((author) => author.active);
  let freelance = authors.freelance.filter((author) => author.active);
  return { bg: bg, cd: cd, freelance: freelance, all: [...bg, ...cd, ...freelance] };
};
