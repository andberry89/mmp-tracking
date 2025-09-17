export const sortDocuments = (docs) => {
  // Filter by status: published, pending, rtp
  let published = docs
    .filter((doc) => doc.published)
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  let rtp = docs.filter(
    (doc) => (!doc.published && doc.status === "Ready to Publish") || doc.status === "Scheduled"
  );
  let pending = docs
    .filter(
      (doc) => !doc.published && doc.status !== "Ready to Publish" && doc.status !== "Scheduled"
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // further sort pending by assigned and unassigned
  // then put "Pending" status first, then "Ready to Edit"
  // and sort the assigned by author team (bg, cd, freelance) and then by author name
  const assigned = pending
    .filter((doc) => doc.author)
    .sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") {
        return -1;
      } else if (a.status !== "Pending" && b.status === "Pending") {
        return 1;
      } else {
        // both have same status, sort by author team and then by author name
        if (a.author.team.slug === b.author.team.slug) {
          return a.author.lastName.localeCompare(b.author.lastName);
        } else {
          const teamOrder = { bg: 1, cd: 2, freelance: 3 };
          return teamOrder[a.author.team.slug] - teamOrder[b.author.tea.slug];
        }
      }
    });

  const unassigned = pending.filter((doc) => !doc.author);
  pending = [...unassigned, ...assigned];

  // sort the rtp by "Ready to Publish" first, then "Scheduled"
  rtp.sort((a, b) => {
    if (a.status === "Ready to Publish" && b.status !== "Ready to Publish") {
      return -1;
    } else if (a.status !== "Ready to Publish" && b.status === "Ready to Publish") {
      return 1;
    } else {
      return new Date(a.embargoDate) - new Date(b.embargoDate);
    }
  });
  // sort the published by by publish date
  published.sort((a, b) => {
    return new Date(b.publishedDate) - new Date(a.publishedDate);
  });

  return {
    published: published,
    pending: pending,
    rtp: rtp,
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
