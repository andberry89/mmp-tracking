import type { TaskDocument } from "@/types";

/**
 * Enforces domain-level rules whenever a task is updated.
 * Happens before saving to the database.
 * For example: if a task is marked "Published", ensure published is set to true.
 */
export const applyTaskRules = (task: TaskDocument): TaskDocument => {
  const normalizedStatus = task.status?.toLowerCase().trim();
  const updatedTask = { ...task };

  // --- Normalize published/updated flag ------------------
  if (normalizedStatus === "published" || normalizedStatus === "updated") {
    updatedTask.published = true;

    // If it was scheduled, set publishedDate to embargoDate, else set it to now

    updatedTask.publishedDate = task.embargoDate ? task.embargoDate : new Date().toISOString();

    if (task.embargoDate) {
      updatedTask.publishedDate = task.embargoDate;
    }

    // if there's no published date, set it to now
    if (!updatedTask.publishedDate) {
      updatedTask.publishedDate = new Date().toISOString();
    }
  } else {
    updatedTask.published = false;
    updatedTask.publishedDate = "";
  }

  // --- Normalize scheduled status ------------------
  if (normalizedStatus === "scheduled") {
    // Change notes to boilerplate text and make sure embargo flag is set to true
    updatedTask.notes = "Scheduled for embargo time";
    updatedTask.embargo = true;
  }

  return updatedTask;
};
