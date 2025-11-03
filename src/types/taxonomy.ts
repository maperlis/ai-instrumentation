export interface TaxonomyEvent {
  event_name: string;
  description: string;
  trigger_action: string;
  screen: string;
  event_properties: string[];
  owner: string;
  notes: string;
  confidence?: number;
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  category: string;
  example_events: string[];
}

export interface GenerateRequest {
  url?: string;
  imageData?: string;
  productDetails?: string;
  mode?: 'metrics' | 'taxonomy';
  selectedMetrics?: string[];
}

export interface GenerateResponse {
  events: TaxonomyEvent[];
  summary: {
    total_events: number;
    naming_convention: string;
    key_metrics: string[];
  };
}

export interface MetricsResponse {
  metrics: Metric[];
}
