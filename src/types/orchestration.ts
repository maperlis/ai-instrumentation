import { TaxonomyEvent, Metric } from "./taxonomy";

export interface ConversationMessage {
  role: 'user' | 'assistant';
  agent?: string;
  content: string;
}

export type OrchestrationStatus = 'idle' | 'processing' | 'waiting_approval' | 'completed' | 'error' | 'rejected';
export type ApprovalType = 'metrics' | 'taxonomy';
export type ActionType = 'start' | 'continue' | 'approve' | 'reject';

export interface OrchestrationRequest {
  sessionId?: string;
  url?: string;
  imageData?: string;
  videoData?: string;
  productDetails?: string;
  mode?: 'metrics' | 'taxonomy';
  selectedMetrics?: string[];
  customFields?: any[];
  userMessage?: string;
  action?: ActionType;
  approvalType?: ApprovalType;
  // For stateless operation - client sends back context
  inputData?: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  };
  metrics?: Metric[];
  events?: TaxonomyEvent[];
}

export interface OrchestrationResponse {
  sessionId: string;
  status: OrchestrationStatus;
  requiresApproval?: boolean;
  approvalType?: ApprovalType;
  metrics?: Metric[];
  events?: TaxonomyEvent[];
  analysis?: string;
  summary?: string;
  message?: string;
  error?: string;
  conversationHistory: ConversationMessage[];
  inputData?: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  };
}

export interface OrchestrationState {
  sessionId: string | null;
  status: OrchestrationStatus;
  metrics: Metric[];
  events: TaxonomyEvent[];
  conversationHistory: ConversationMessage[];
  approvalType: ApprovalType | null;
  requiresApproval: boolean;
  inputData: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  } | null;
}
