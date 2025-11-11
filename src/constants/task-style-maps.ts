export const DATE_FORMAT_MAP = {
  embargo: "text-orange-400 font-bold",
  published: "text-gray-900",
};

export const STATUS_CLASS_MAP = {
  pending: "bg-sky-600 text-sky-50",
  rte: "bg-purple-600 text-purple-50",
  rtp: "bg-orange-600 text-orange-50",
  scheduled: "bg-amber-600 text-amber-50",
  updated: "bg-teal-600 text-teal-50",
  published: "bg-green-600 text-green-50",
} as const;

export const TEAM_COLOR_MAP = {
  freelance: " bg-pink-500",
  bg: "bg-indigo-600",
  cd: "bg-teal-400",
};

export const STATUS_VALUE_MAP = {
  Pending: "pending",
  "Ready to Edit": "rte",
  "Ready to Publish": "rtp",
  Scheduled: "scheduled",
  Updated: "updated",
  Published: "published",
} as const;
