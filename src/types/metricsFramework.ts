export type FrameworkType = 'driver_tree' | 'conversion_funnel' | 'growth_flywheel';

export interface MetricNode {
  id: string;
  name: string;
  description: string;
  category: string;
  currentValue?: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  status?: 'healthy' | 'warning' | 'critical';
  isNorthStar?: boolean;
  parentId?: string | null;
  level?: number;
  influenceDescription?: string;
  example_events?: string[];
  calculation?: string;
  businessQuestions?: string[];
}

export interface MetricRelationship {
  sourceId: string;
  targetId: string;
  influenceStrength?: 'strong' | 'medium' | 'weak';
  description?: string;
}

export interface FrameworkRecommendation {
  recommendedFramework: FrameworkType;
  confidence: number;
  reasoning: string;
  clarifyingQuestions?: ClarifyingQuestion[];
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'single_choice' | 'multiple_choice' | 'text';
}

export interface FrameworkData {
  framework: FrameworkType;
  northStarMetric: MetricNode | null;
  metrics: MetricNode[];
  relationships: MetricRelationship[];
  aiNarrative?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  count?: number;
  conversionRate?: number;
  trend?: 'up' | 'down' | 'stable';
  driverMetrics: MetricNode[];
}

export interface FlywheelLoop {
  id: string;
  name: string;
  metrics: MetricNode[];
  momentum: 'strong' | 'medium' | 'weak';
  description: string;
}
