import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FrameworkType, FrameworkData, MetricNode, MetricRelationship, FunnelStage, FlywheelLoop, FrameworkRecommendation, ClarifyingQuestion } from "@/types/metricsFramework";
import { Metric } from "@/types/taxonomy";
import { FrameworkSelector } from "./FrameworkSelector";
import { DriverTreeVisualization } from "./DriverTreeVisualization";
import { ConversionFunnelVisualization } from "./ConversionFunnelVisualization";
import { GrowthFlywheelVisualization } from "./GrowthFlywheelVisualization";
import { AINarrativePanel } from "./AINarrativePanel";
import { FrameworkRecommendationFlow } from "./FrameworkRecommendationFlow";
import { AgentChat } from "@/components/AgentChat";
import { ConversationMessage } from "@/types/orchestration";

interface MetricsFrameworkViewProps {
  metrics: Metric[];
  selectedMetricIds: string[];
  onToggleMetric: (metricId: string) => void;
  onApprove: () => void;
  isLoading: boolean;
  conversationHistory: ConversationMessage[];
  onSendMessage: (message: string) => void;
  newMetricIds?: string[];
  frameworkRecommendation?: FrameworkRecommendation | null;
  clarifyingQuestions?: ClarifyingQuestion[];
  onClarifyingAnswer?: (answers: Record<string, string>) => void;
}

export function MetricsFrameworkView({
  metrics,
  selectedMetricIds,
  onToggleMetric,
  onApprove,
  isLoading,
  conversationHistory,
  onSendMessage,
  newMetricIds = [],
  frameworkRecommendation,
  clarifyingQuestions = [],
  onClarifyingAnswer,
}: MetricsFrameworkViewProps) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('driver_tree');
  const [selectedMetric, setSelectedMetric] = useState<MetricNode | null>(null);
  const [showRecommendationFlow, setShowRecommendationFlow] = useState(true);
  const [northStarId, setNorthStarId] = useState<string | null>(null);

  // When framework recommendation comes in, use it
  useEffect(() => {
    if (frameworkRecommendation?.recommendedFramework) {
      setSelectedFramework(frameworkRecommendation.recommendedFramework);
    }
  }, [frameworkRecommendation]);

  // Convert Metric[] to MetricNode[] with 3-level hierarchy
  const metricNodes: MetricNode[] = useMemo(() => {
    const selectedMetrics = metrics.filter((m) => selectedMetricIds.includes(m.id));
    if (selectedMetrics.length === 0) return [];

    // Determine North Star (first metric or explicit northStarId)
    const northStarMetricId = northStarId || selectedMetrics[0]?.id;
    
    // Group remaining metrics by category to create driver/sub-driver structure
    const otherMetrics = selectedMetrics.filter(m => m.id !== northStarMetricId);
    const categories = [...new Set(otherMetrics.map(m => m.category))];
    
    // First metric in each category becomes a driver (level 1)
    // Remaining metrics in each category become sub-drivers (level 2)
    const driverIds = new Set<string>();
    const categoryFirstMetric: Record<string, string> = {};
    
    categories.forEach(category => {
      const firstInCategory = otherMetrics.find(m => m.category === category);
      if (firstInCategory) {
        driverIds.add(firstInCategory.id);
        categoryFirstMetric[category] = firstInCategory.id;
      }
    });

    return selectedMetrics.map((m) => {
      const isNorthStar = m.id === northStarMetricId;
      const isDriver = driverIds.has(m.id);
      
      let level = 2; // Default to sub-driver
      let parentId: string | null = null;
      
      if (isNorthStar) {
        level = 0;
        parentId = null;
      } else if (isDriver) {
        level = 1;
        parentId = northStarMetricId;
      } else {
        level = 2;
        // Parent is the driver metric from the same category
        parentId = categoryFirstMetric[m.category] || northStarMetricId;
      }

      const metricWithLevel = m as Metric & { influenceDescription?: string };
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        example_events: m.example_events,
        isNorthStar,
        level,
        parentId,
        influenceDescription: metricWithLevel.influenceDescription || 
          (isDriver 
            ? `Core driver for ${selectedMetrics[0]?.name || 'your North Star'}`
            : `Sub-driver contributing to ${m.category} metrics`),
        status: 'healthy' as const,
        trend: 'up' as const,
        trendPercentage: Math.floor(Math.random() * 20) + 1,
      };
    });
  }, [metrics, selectedMetricIds, northStarId]);

  // Build relationships based on parent-child hierarchy
  const relationships: MetricRelationship[] = useMemo(() => {
    const rels: MetricRelationship[] = [];
    
    metricNodes.forEach(metric => {
      if (metric.parentId) {
        rels.push({
          sourceId: metric.parentId,
          targetId: metric.id,
          influenceStrength: metric.level === 1 ? 'strong' : 'medium',
          description: `Drives ${metric.name}`,
        });
      }
    });
    
    return rels;
  }, [metricNodes]);

  // Framework data
  const frameworkData: FrameworkData = useMemo(
    () => ({
      framework: selectedFramework,
      northStarMetric: metricNodes.find((m) => m.isNorthStar) || null,
      metrics: metricNodes,
      relationships,
      aiNarrative: frameworkRecommendation?.reasoning || 
        "Select your key metrics to see how they relate to each other and drive your North Star metric.",
    }),
    [selectedFramework, metricNodes, relationships, frameworkRecommendation]
  );

  // Convert to funnel stages
  const funnelStages: FunnelStage[] = useMemo(() => {
    const stages = ['Awareness', 'Acquisition', 'Activation', 'Retention', 'Revenue', 'Referral'];
    const categoryToStage: Record<string, string> = {
      'Acquisition': 'Acquisition',
      'Engagement': 'Activation',
      'Retention': 'Retention',
      'Monetization': 'Revenue',
      'Product Usage': 'Activation',
    };

    return stages.map((stageName, index) => {
      const stageMetrics = metricNodes.filter(
        (m) => categoryToStage[m.category] === stageName
      );
      
      return {
        id: stageName.toLowerCase(),
        name: stageName,
        count: Math.floor(10000 / (index + 1)),
        conversionRate: 100 - index * 15,
        trend: 'up' as const,
        driverMetrics: stageMetrics,
      };
    }).filter((stage) => stage.count > 0);
  }, [metricNodes]);

  // Convert to flywheel loops
  const flywheelLoops: FlywheelLoop[] = useMemo(() => {
    const loopTemplates = [
      { name: 'Acquisition Loop', categories: ['Acquisition'], momentum: 'strong' as const },
      { name: 'Engagement Loop', categories: ['Engagement', 'Product Usage'], momentum: 'medium' as const },
      { name: 'Retention Loop', categories: ['Retention'], momentum: 'strong' as const },
      { name: 'Monetization Loop', categories: ['Monetization'], momentum: 'weak' as const },
    ];

    return loopTemplates.map((template) => ({
      id: template.name.toLowerCase().replace(' ', '-'),
      name: template.name,
      metrics: metricNodes.filter((m) => template.categories.includes(m.category)),
      momentum: template.momentum,
      description: `Metrics that drive ${template.name.toLowerCase()}`,
    })).filter((loop) => loop.metrics.length > 0);
  }, [metricNodes]);

  const handleFrameworkSelect = useCallback((framework: FrameworkType) => {
    setSelectedFramework(framework);
    setShowRecommendationFlow(false);
  }, []);

  const handleMetricSelect = useCallback((metric: MetricNode) => {
    setSelectedMetric(metric);
  }, []);

  return (
    <div className="h-full flex">
      {/* Left Panel - Chat or Recommendation Flow */}
      <div className="w-[380px] border-r flex flex-col bg-card">
        <AnimatePresence mode="wait">
          {showRecommendationFlow && (clarifyingQuestions.length > 0 || frameworkRecommendation) ? (
            <motion.div
              key="recommendation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <FrameworkRecommendationFlow
                recommendation={frameworkRecommendation}
                clarifyingQuestions={clarifyingQuestions}
                isLoading={isLoading}
                onAnswer={(answers) => {
                  onClarifyingAnswer?.(answers);
                }}
                onFrameworkSelect={handleFrameworkSelect}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <AgentChat
                conversationHistory={conversationHistory}
                agentName="Product Analyst"
                agentDescription="Ask about metrics, frameworks, or request different recommendations"
                isLoading={isLoading}
                onSendMessage={onSendMessage}
                placeholder="Ask about metrics or frameworks..."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Panel - Visualization */}
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs defaultValue="visualization" className="flex-1 flex flex-col">
          {/* Header with Tabs and Actions */}
          <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="visualization" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Visualization
                </TabsTrigger>
                <TabsTrigger value="selection" className="gap-2">
                  <List className="w-4 h-4" />
                  Select Metrics
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {selectedMetricIds.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              <FrameworkSelector
                selectedFramework={selectedFramework}
                onSelect={setSelectedFramework}
                recommendedFramework={frameworkRecommendation?.recommendedFramework}
              />
            </div>
            
            <Button
              onClick={onApprove}
              disabled={selectedMetricIds.length === 0 || isLoading}
              size="lg"
              className="shadow-lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Generate Taxonomy ({selectedMetricIds.length})
            </Button>
          </div>

          {/* Visualization Tab */}
          <TabsContent value="visualization" className="flex-1 m-0 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedFramework === 'driver_tree' && (
                <motion.div
                  key="driver-tree"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <DriverTreeVisualization
                    data={frameworkData}
                    onMetricSelect={handleMetricSelect}
                    selectedMetricId={selectedMetric?.id}
                  />
                </motion.div>
              )}

              {selectedFramework === 'conversion_funnel' && (
                <motion.div
                  key="funnel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <ConversionFunnelVisualization
                    stages={funnelStages}
                    northStarMetric={frameworkData.northStarMetric}
                    onStageSelect={() => {}}
                    onMetricSelect={handleMetricSelect}
                  />
                </motion.div>
              )}

              {selectedFramework === 'growth_flywheel' && (
                <motion.div
                  key="flywheel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <GrowthFlywheelVisualization
                    loops={flywheelLoops}
                    northStarMetric={frameworkData.northStarMetric}
                    onLoopSelect={() => {}}
                    onMetricSelect={handleMetricSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Metric Selection Tab */}
          <TabsContent value="selection" className="flex-1 m-0 relative overflow-hidden">
            <div className="absolute inset-0 overflow-auto">
              <div className="p-6 space-y-4 pb-12">
                {/* Group metrics by category */}
                {Object.entries(
                  metrics.reduce((acc, metric) => {
                    const category = metric.category || 'Uncategorized';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(metric);
                    return acc;
                  }, {} as Record<string, Metric[]>)
                ).map(([category, categoryMetrics]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="grid gap-2">
                      {categoryMetrics.map((metric) => {
                        const isSelected = selectedMetricIds.includes(metric.id);
                        const isNew = newMetricIds.includes(metric.id);
                        
                        return (
                          <div
                            key={metric.id}
                            onClick={() => onToggleMetric(metric.id)}
                            className={`
                              p-4 rounded-lg border cursor-pointer transition-all
                              ${isSelected 
                                ? 'bg-primary/10 border-primary/50' 
                                : 'bg-card hover:bg-accent/50 border-border'
                              }
                              ${isNew ? 'ring-2 ring-primary/50 ring-offset-2' : ''}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleMetric(metric.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{metric.name}</span>
                                  {isNew && (
                                    <Badge variant="default" className="text-xs">New</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {metric.description}
                                </p>
                                {metric.example_events && metric.example_events.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {metric.example_events.slice(0, 3).map((event, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {event}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - AI Narrative */}
      <div className="w-[280px]">
        <AINarrativePanel
          narrative={frameworkData.aiNarrative || ""}
          selectedMetric={selectedMetric}
          isLoading={isLoading}
          onMetricUpdate={(updated) => {
            setSelectedMetric(updated);
          }}
        />
      </div>
    </div>
  );
}
