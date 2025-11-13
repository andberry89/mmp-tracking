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

    // if there's no published date, set it to now
    if (!updatedTask.publishedDate) {
      updatedTask.publishedDate = new Date().toISOString();
    }
  } else {
    updatedTask.published = false;
    updatedTask.publishedDate = "";
  }

  return updatedTask;
};
