export interface TaskAsset {
  id?: string;
  kind?: "imeet" | "material";
  label?: string;
  url: string;
  notes: string;
}
