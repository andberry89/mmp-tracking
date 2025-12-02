import type { TaskAuthor } from "./Author";
import type { TaskAsset } from "./TaskAsset";
import type { TaskVehicle } from "./TaskVehicle";

export type TaskStatus =
  | "Pending"
  | "Ready to Edit"
  | "Ready to Publish"
  | "Scheduled"
  | "Published"
  | "Updated";

export interface TaskDocument {
  id: string;
  highPriority: boolean;

  vehicle: TaskVehicle;

  author: TaskAuthor | null;

  deadline: string;
  status: TaskStatus;
  notes: string;

  assets: TaskAsset[];

  embargoDate: string;
  embargoNotes: string;
  embargo: boolean;

  published: boolean;
  new: boolean;
  publishedDate: string;
}

export interface DocumentsByStatus {
  pending: TaskDocument[];
  rtp: TaskDocument[];
  published: TaskDocument[];
}
