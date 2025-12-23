import type { TaskStatus } from "./types";

/**
 * Canonical status groupings used across the app.
 */

export const PENDING_STATUSES = ["pending", "rte"] as const;
export const RTP_STATUSES = ["rtp", "scheduled"] as const;
export const PUBLISHED_STATUSES = ["published", "updated"] as const;

/**
 * (Optional but useful)
 * Derived union types from the constants above.
 * These stay automatically in sync with the arrays.
 */

export type PendingStatus = (typeof PENDING_STATUSES)[number];
export type RtpStatus = (typeof RTP_STATUSES)[number];
export type PublishedStatus = (typeof PUBLISHED_STATUSES)[number];

/**
 * Compile-time safety check:
 * Ensures all grouped statuses are valid TaskStatus values.
 * If someone mistypes a status, TypeScript will error here.
 */

const _assertStatusGroupsAreValid: readonly TaskStatus[] = [
  ...PENDING_STATUSES,
  ...RTP_STATUSES,
  ...PUBLISHED_STATUSES,
];
