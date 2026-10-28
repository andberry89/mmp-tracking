import type { TaskAsset } from "./TaskAsset";
import type { TaskVehicle } from "./TaskVehicle";
import type { AuthorId } from "./ids";

export type TaskStatus = "pending" | "rte" | "rtp" | "scheduled" | "published" | "updated";

export interface TaskDocument {
  id: string;
  modelYearVehicleId?: string;
  createdDate?: string;
  updatedDate?: string[];
  highPriority: boolean;
  vehicle: TaskVehicle;
  authorId: AuthorId | null;
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

export interface TaskResourceInput {
  label: string;
  url: string;
  notes: string;
  password: string;
}

export interface NewTaskInput {
  modelId: string;
  segmentId: string | null;
  make: string;
  model: string;
  modelYear: number;
  segment: string;
  authorId: AuthorId | null;
  deadline: string;
  status: TaskStatus;
  isUpdate: boolean;
  notes: string;
  embargoDate: string;
  embargoNotes: string;
  imeetUrl: string;
  materials: TaskResourceInput[];
}

export interface DocumentsByStatus {
  pending: TaskDocument[];
  rtp: TaskDocument[];
  published: TaskDocument[];
}
