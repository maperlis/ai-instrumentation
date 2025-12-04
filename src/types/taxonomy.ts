export interface TaxonomyField {
  id: string;
  name: string;
  type: 'text' | 'array' | 'number';
  required: boolean;
  description?: string;
}

export interface TaxonomyEvent {
  event_name: string;
  description: string;
  trigger_action: string;
  screen: string;
  event_properties: string[];
  owner: string;
  notes: string;
  confidence?: number;
  [key: string]: any; // Allow custom fields
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  category: string;
  example_events: string[];
  calculation?: string;
  businessQuestions?: string[];
  influenceDescription?: string;
  level?: number;
}

export interface GenerateRequest {
  url?: string;
  imageData?: string;
  productDetails?: string;
  mode?: 'metrics' | 'taxonomy';
  selectedMetrics?: string[];
  customFields?: TaxonomyField[];
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

export const DEFAULT_TAXONOMY_FIELDS: TaxonomyField[] = [
  { id: 'event_name', name: 'Event Name', type: 'text', required: true },
  { id: 'description', name: 'Description', type: 'text', required: true },
  { id: 'trigger_action', name: 'Trigger Action', type: 'text', required: true },
  { id: 'screen', name: 'Screen', type: 'text', required: true },
  { id: 'event_properties', name: 'Event Properties', type: 'array', required: true },
  { id: 'owner', name: 'Owner', type: 'text', required: true },
  { id: 'notes', name: 'Notes', type: 'text', required: false },
];
