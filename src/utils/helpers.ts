import {
  previousSunday,
  nextSaturday,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";

export const compareDates = (a: string | Date, b: string | Date) =>
  new Date(a).getTime() - new Date(b).getTime();

// export const normalizeStatus = (status: string) => {
//   // Normalize status strings to match expected values
//   const s = status.toLowerCase().trim();
//   switch (s) {
//     case "rtp":
//     case "ready to publish":
//       return "Ready to Publish";
//     case "rte":
//     case "ready to edit":
//       return "Ready to Edit";
//     case "pending":
//       return "Pending";
//     case "scheduled":
//       return "Scheduled";
//     case "published":
//       return "Published";
//     case "updated":
//       return "Updated";
//     default:
//       return "Unknown";
//   }
// };

export const getRangeDates = (rangeId: string | null) => {
  if (!rangeId) return null;

  // Calculate date ranges based on the provided rangeId
  const now = new Date();

  switch (rangeId) {
    case "last_week": {
      const thisWeekStart = previousSunday(now);
      const lastWeekStart = subWeeks(thisWeekStart, 1);
      const lastWeekEnd = nextSaturday(lastWeekStart);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case "this_week": {
      const weekStart = previousSunday(now);
      const weekEnd = nextSaturday(weekStart);
      return { start: weekStart, end: weekEnd };
    }
    case "last_month": {
      const firstOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));
      return { start: firstOfLastMonth, end: endOfLastMonth };
    }
    case "this_month": {
      const firstOfThisMonth = startOfMonth(now);
      const endOfThisMonth = endOfMonth(now);
      return { start: firstOfThisMonth, end: endOfThisMonth };
    }
    default:
      return null;
  }
};
