// Types for user-imported existing metrics
export interface ExistingMetric {
  id: string;
  name: string;
  definition: string;
  source: 'csv' | 'pasted' | 'manual';
}

export interface MetricComparisonStatus {
  id: string;
  name: string;
  definition: string;
  status: 'existing' | 'new' | 'needs_update';
  source?: 'csv' | 'pasted' | 'manual' | 'ai';
  updateReason?: string; // Reason why update is recommended
  originalMetricId?: string; // Link to original existing metric if applicable
}

export interface ParsedMetricsResult {
  metrics: ExistingMetric[];
  parseErrors?: string[];
}
