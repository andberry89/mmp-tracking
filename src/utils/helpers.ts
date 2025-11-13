export const compareDates = (a: string | Date, b: string | Date) =>
  new Date(a).getTime() - new Date(b).getTime();

export const normalizeStatus = (status: string) => {
  // Normalize status strings to match expected values
  const s = status.toLowerCase().trim();
  switch (s) {
    case "rtp":
    case "ready to publish":
      return "Ready to Publish";
    case "rte":
    case "ready to edit":
      return "Ready to Edit";
    case "pending":
      return "Pending";
    case "scheduled":
      return "Scheduled";
    case "published":
      return "Published";
    case "updated":
      return "Updated";
    default:
      return "Unknown";
  }
};
