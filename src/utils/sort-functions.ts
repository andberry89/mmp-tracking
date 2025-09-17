const compareDates = (a: string | Date, b: string | Date) =>
  new Date(a).getTime() - new Date(b).getTime();

export const sortDocuments = (docs) => {
  // Filter by status
  let published = docs
    .filter((doc) => doc.published)
    .sort((a, b) => compareDates(b.publishedDate, a.publishedDate));

  let rtp = docs.filter(
    (doc) => (!doc.published && doc.status === "Ready to Publish") || doc.status === "Scheduled"
  );

  let pending = docs
    .filter(
      (doc) => !doc.published && doc.status !== "Ready to Publish" && doc.status !== "Scheduled"
    )
    .sort((a, b) => compareDates(a.deadline, b.deadline));

  // Sort pending: assigned vs unassigned → then by status → then by team/name
  const assigned = pending
    .filter((doc) => doc.author)
    .sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;

      // same status, sort by team then lastName
      const teamOrder = { bg: 1, cd: 2, freelance: 3 };
      const teamA = teamOrder[a.author.team.slug];
      const teamB = teamOrder[b.author.team.slug];

      if (teamA === teamB) {
        return a.author.lastName.localeCompare(b.author.lastName);
      }

      return teamA - teamB;
    });

  const unassigned = pending.filter((doc) => !doc.author);
  pending = [...unassigned, ...assigned];

  // Sort rtp: "Ready to Publish" before "Scheduled", then by embargoDate
  rtp.sort((a, b) => {
    if (a.status === "Ready to Publish" && b.status !== "Ready to Publish") return -1;
    if (a.status !== "Ready to Publish" && b.status === "Ready to Publish") return 1;
    return compareDates(a.embargoDate, b.embargoDate);
  });

  return {
    published,
    pending,
    rtp,
  };
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
