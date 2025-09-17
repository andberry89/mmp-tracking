export interface TaskDocument {
  id: string;
  highPriority: boolean;
  vehicle: {
    make: string;
    model: string;
    segment: string;
    modelYear: number;
  };
  author: null | {
    id: string;
    firstName: string;
    lastName: string;
    initials: string;
    team: "bg" | "cd" | "freelance";
    active: boolean;
  };
  deadline: string;
  status: "Pending" | "Ready to Edit" | "Ready to Publish" | "Scheduled" | "Published" | "Updated"; // add any others if needed
  notes: string;
  assets: {
    url: string;
    notes: string;
  }[];
  embargoDate: string; // ISO 8601 date or empty string
  embargoNotes: string;
  embargo: boolean;
  published: boolean;
  new: boolean;
  publishedDate: string; // ISO string or empty
}

export interface DocumentsByStatus {
  pending: TaskDocument[];
  rtp: TaskDocument[];
  published: TaskDocument[];
}
