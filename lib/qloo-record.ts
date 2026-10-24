// Client-safe description of one Qloo request (no key, no server code).
export interface QlooCallRecord {
  path: string;
  params: Record<string, string>;
  url: string;
  status: number;
  cached: boolean;
  ms: number;
  at: string;
  resultCount: number;
}
