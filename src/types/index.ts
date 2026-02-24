// ── Rolling 24-Day Plant ZDC Hub Operations Types ─────────────────

export interface UploadBatch {
  id: number;
  upload_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface PLANTFLOW7Record {
  id: number;
  batch_id: number;
  plant: string;
  location: string;
  pgi_no: string;
  pgi_date: string;
  nc_cc: string; // "YES" or "NO"
  mode: string;
  case_count: number;
  preferred_edd: string;
  dispatch_remark: string;
  remarks: string;
  is_ready: boolean;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  inProcess: number;
  ready: number;
  totalRows: number;
  inProcessRows: number;
  readyRows: number;
}

export interface RecordsResponse {
  batch: UploadBatch | null;
  in_process_list: PLANTFLOW7Record[];
  ready_list: PLANTFLOW7Record[];
  stats: DashboardStats;
}
