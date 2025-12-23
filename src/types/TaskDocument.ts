import type { TaskAsset } from "./TaskAsset";
import type { TaskVehicle } from "./TaskVehicle";

export type TaskStatus = "pending" | "rte" | "rtp" | "scheduled" | "published" | "updated";

export interface TaskDocument {
  id: string;
  highPriority: boolean;
  vehicle: TaskVehicle;
  authorId: string | null;
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
