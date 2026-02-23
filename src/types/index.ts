// ── Rolling 7-Day Plant Logistics Types ─────────────────

export interface UploadBatch {
  id: number;
  upload_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface LogisticsRecord {
  id: number;
  batch_id: number;
  plant: string;
  location: string;
  pgi_no: string;
  pgi_date: string;
  invoice_no: string;
  invoice_date: string;
  mode: string;
  case_count: number;
  weight: number;
  volume: number;
  amount: number;
  preferred_mode: string;
  preferred_edd: string;
  dispatch_remark: string;
  eod_data: string;
  is_ready: boolean;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  inProcess: number;
  ready: number;
  totalAmount: number;
  totalWeight: number;
  totalVolume: number;
}

export interface RecordsResponse {
  batch: UploadBatch | null;
  in_process_list: LogisticsRecord[];
  ready_list: LogisticsRecord[];
  stats: DashboardStats;
}

export interface PlantHistoryRecord {
  upload_date: string;
  mode: string;
  weight: number;
  amount: number;
  invoice_no: string;
  eod_data: string;
}

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
 