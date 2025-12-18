import type { TaskDocument } from "@/types";

/**
 * Enforces domain-level rules whenever a task is updated.
 * Pure function: does not mutate input.
 */
export const applyTaskRules = (task: TaskDocument): TaskDocument => {
  const normalizedStatus = task.status?.toLowerCase().trim();

  const now = new Date().toISOString();

  const updatedTask: TaskDocument = {
    ...task,

    // Ensure required fields are always defined
    notes: task.notes ?? "",
    assets: Array.isArray(task.assets) ? task.assets : [],
    embargo: Boolean(task.embargo),
    published: Boolean(task.published),
    publishedDate: task.publishedDate ?? "",
  };

  // --- Normalize "Ready to Edit" ------------------
  if (normalizedStatus === "rte") {
    updatedTask.notes = "";
  }

  // --- Normalize Published / Updated ------------------
  if (normalizedStatus === "published" || normalizedStatus === "updated") {
    updatedTask.published = true;

    if (task.embargoDate) {
      updatedTask.publishedDate = task.embargoDate;
    } else if (!updatedTask.publishedDate) {
      updatedTask.publishedDate = now;
    }
  } else {
    updatedTask.published = false;
    updatedTask.publishedDate = "";
  }

  // --- Normalize Scheduled ------------------
  if (normalizedStatus === "scheduled") {
    updatedTask.notes = "Scheduled for embargo time";
    updatedTask.embargo = true;
  }

  return updatedTask;
};
