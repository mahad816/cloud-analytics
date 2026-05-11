export interface Dataset {
  id: number;
  filename: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | string;
  created_at: string;
  completed_at?: string | null;
  row_count?: number | null;
  column_count?: number | null;
  processing_result?: string | null;
  error_message?: string | null;
}

export interface AnalysisData {
  shape?: {
    rows?: number;
    columns?: number;
  };
  columns?: string[];
  statistics?: Record<string, { mean?: number; std?: number }>;
  missing_data?: Record<string, number>;
  dtypes?: Record<string, string>;
  categorical_summary?: Record<string, Record<string, number>>;
  correlation_matrix?: Record<string, Record<string, number>>;
}
