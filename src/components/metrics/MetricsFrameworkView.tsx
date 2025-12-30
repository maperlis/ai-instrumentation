import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, List, Star, PanelRightOpen, MousePointerClick, CheckCircle2, PlusCircle, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FrameworkType, FrameworkData, MetricNode, MetricRelationship, FunnelStage, FlywheelLoop } from "@/types/metricsFramework";
import { Metric } from "@/types/taxonomy";
import { ExistingMetric } from "@/types/existingMetrics";
import { FrameworkSelector } from "./FrameworkSelector";
import { EditableDriverTree } from "./EditableDriverTree";
import { ConversionFunnelVisualization } from "./ConversionFunnelVisualization";
import { GrowthFlywheelVisualization } from "./GrowthFlywheelVisualization";
import { AINarrativePanel } from "./AINarrativePanel";
import { AgentChat } from "@/components/AgentChat";
import { ConversationMessage } from "@/types/orchestration";

// Types for merged metrics with comparison status
type MetricStatus = 'existing' | 'new' | 'needs_update';

interface MergedMetric extends Metric {
  status: MetricStatus;
  originalDefinition?: string;
  updateReason?: string;
  isUserImported?: boolean;
}

interface MetricsFrameworkViewProps {
  metrics: Metric[];
  selectedMetricIds: string[];
  onToggleMetric: (metricId: string) => void;
  onApprove: () => void;
  isLoading: boolean;
  conversationHistory: ConversationMessage[];
  onSendMessage: (message: string) => void;
  newMetricIds?: string[];
  initialFramework?: FrameworkType;
  existingMetrics?: ExistingMetric[];
}

// Simple Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
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
  initialFramework = 'driver_tree',
  existingMetrics = [],
}: MetricsFrameworkViewProps) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>(initialFramework);
  const [selectedMetric, setSelectedMetric] = useState<MetricNode | null>(null);
  const [northStarId, setNorthStarId] = useState<string | null>(null);
  const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);

  // Sync with initial framework if it changes
  useEffect(() => {
    setSelectedFramework(initialFramework);
  }, [initialFramework]);

  // Auto-expand panel when metric is selected
  useEffect(() => {
    if (selectedMetric) {
      setIsInsightsPanelOpen(true);
    }
  }, [selectedMetric]);

  // Merge existing metrics with AI-generated metrics and determine status
  const mergedMetrics: MergedMetric[] = useMemo(() => {
    const result: MergedMetric[] = [];
    const matchedExistingIds = new Set<string>();

    // First, process AI-generated metrics and match with existing
    for (const generated of metrics) {
      const normalizedGenName = generated.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Find matching existing metric by name similarity
      const matchingExisting = existingMetrics.find(existing => {
        const normalizedExistName = existing.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedGenName.includes(normalizedExistName) || 
               normalizedExistName.includes(normalizedGenName) ||
               levenshteinDistance(normalizedGenName, normalizedExistName) < 3;
      });

      if (matchingExisting) {
        matchedExistingIds.add(matchingExisting.id);
        
        // Check if definitions differ significantly
        const definitionsDiffer = matchingExisting.definition && generated.description &&
          levenshteinDistance(
            matchingExisting.definition.toLowerCase(),
            generated.description.toLowerCase()
          ) > Math.min(matchingExisting.definition.length, generated.description.length) * 0.3;

        result.push({
          ...generated,
          status: definitionsDiffer ? 'needs_update' : 'existing',
          originalDefinition: matchingExisting.definition,
          updateReason: definitionsDiffer 
            ? `AI suggests updated definition` 
            : undefined,
        });
      } else {
        result.push({
          ...generated,
          status: 'new',
        });
      }
    }

    // Add existing metrics that weren't matched (user-imported but not in AI recommendations)
    for (const existing of existingMetrics) {
      if (!matchedExistingIds.has(existing.id)) {
        result.push({
          id: existing.id,
          name: existing.name,
          description: existing.definition,
          category: 'Imported',
          example_events: [],
          status: 'existing',
          isUserImported: true,
        });
      }
    }

    return result;
  }, [metrics, existingMetrics]);

  // Stats for the summary
  const metricStats = useMemo(() => {
    const existing = mergedMetrics.filter(m => m.status === 'existing').length;
    const newMetrics = mergedMetrics.filter(m => m.status === 'new').length;
    const needsUpdate = mergedMetrics.filter(m => m.status === 'needs_update').length;
    return { existing, newMetrics, needsUpdate, total: mergedMetrics.length };
  }, [mergedMetrics]);

  // Convert merged metrics to MetricNode[] with 3-level hierarchy (includes existing + AI metrics)
  const metricNodes: MetricNode[] = useMemo(() => {
    const selectedMetrics = mergedMetrics.filter((m) => selectedMetricIds.includes(m.id));
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

      return {
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        example_events: m.example_events,
        calculation: m.calculation,
        businessQuestions: m.businessQuestions,
        isNorthStar,
        level,
        parentId,
        influenceDescription: m.influenceDescription || 
          (isDriver 
            ? `Core driver for ${selectedMetrics[0]?.name || 'your North Star'}`
            : `Sub-driver contributing to ${m.category} metrics`),
        status: 'healthy' as const,
        trend: 'up' as const,
        trendPercentage: Math.floor(Math.random() * 20) + 1,
      };
    });
  }, [mergedMetrics, selectedMetricIds, northStarId]);

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
      aiNarrative: "Select your key metrics to see how they relate to each other and drive your North Star metric.",
    }),
    [selectedFramework, metricNodes, relationships]
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

  // Handle metric click from visualization - directly set or clear
  const handleMetricSelect = useCallback((metric: MetricNode | null) => {
    setSelectedMetric(metric);
  }, []);

  const handleSetNorthStar = useCallback((metricId: string) => {
    setNorthStarId(metricId);
  }, []);

  return (
    <div className="h-full flex">
      {/* Left Panel - Chat */}
      <div className="w-[380px] border-r flex flex-col bg-card">
        <AgentChat
          conversationHistory={conversationHistory}
          agentName="Product Analyst"
          agentDescription="Ask about metrics, frameworks, or request different recommendations"
          isLoading={isLoading}
          onSendMessage={onSendMessage}
          placeholder="Ask about metrics or frameworks..."
        />
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
                  <EditableDriverTree
                    data={frameworkData}
                    onMetricSelect={handleMetricSelect}
                    selectedMetricId={selectedMetric?.id}
                    storageKey="metrics-driver-tree"
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
                {/* Summary Stats - only show if there are existing metrics */}
                {existingMetrics.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{metricStats.existing}</p>
                        <p className="text-xs text-muted-foreground">Existing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <PlusCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{metricStats.newMetrics}</p>
                        <p className="text-xs text-muted-foreground">New (AI)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{metricStats.needsUpdate}</p>
                        <p className="text-xs text-muted-foreground">Update</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group metrics by category */}
                {Object.entries(
                  mergedMetrics.reduce((acc, metric) => {
                    const category = metric.category || 'Uncategorized';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(metric);
                    return acc;
                  }, {} as Record<string, MergedMetric[]>)
                ).map(([category, categoryMetrics]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="grid gap-2">
                      {categoryMetrics.map((metric) => {
                        const isSelected = selectedMetricIds.includes(metric.id);
                        const currentNorthStarId = northStarId || (selectedMetricIds.length > 0 ? mergedMetrics.find(m => selectedMetricIds.includes(m.id))?.id : null);
                        const isNorthStar = metric.id === currentNorthStarId;
                        
                        return (
                          <div
                            key={metric.id}
                            className={`
                              p-4 rounded-lg border transition-all
                              ${isSelected 
                                ? 'bg-primary/10 border-primary/50' 
                                : 'bg-card hover:bg-accent/50 border-border'
                              }
                              ${metric.status === 'new' ? 'ring-2 ring-blue-500/30' : ''}
                              ${metric.status === 'needs_update' ? 'ring-2 ring-amber-500/30' : ''}
                              ${isNorthStar && isSelected ? 'ring-2 ring-amber-500/50' : ''}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleMetric(metric.id)}
                                className="mt-0.5 cursor-pointer"
                              />
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onToggleMetric(metric.id)}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{metric.name}</span>
                                  
                                  {/* Status badges */}
                                  {metric.status === 'existing' && existingMetrics.length > 0 && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Existing
                                    </Badge>
                                  )}
                                  {metric.status === 'new' && (
                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                                      <PlusCircle className="w-3 h-3 mr-1" />
                                      New (AI)
                                    </Badge>
                                  )}
                                  {metric.status === 'needs_update' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 cursor-help">
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Update
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="text-sm font-medium mb-1">Definition update suggested</p>
                                          {metric.originalDefinition && (
                                            <p className="text-xs text-muted-foreground">
                                              <strong>Original:</strong> {metric.originalDefinition}
                                            </p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {metric.isUserImported && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                      Imported
                                    </Badge>
                                  )}
                                  
                                  {isNorthStar && isSelected && (
                                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                      <Star className="w-3 h-3 mr-1 fill-amber-500" />
                                      North Star
                                    </Badge>
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
                              
                              {/* North Star button + Question prompt for imported metrics */}
                              <div className="flex items-center gap-1">
                                {metric.isUserImported && !isNorthStar && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSendMessage(`Should "${metric.name}" be considered a North Star metric or a core driver? Here's its definition: ${metric.description}`);
                                          }}
                                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                        >
                                          <HelpCircle className="w-4 h-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Ask AI about this metric's role
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {isSelected && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetNorthStar(metric.id);
                                          }}
                                          className={`
                                            p-1.5 rounded-md transition-all
                                            ${isNorthStar 
                                              ? 'text-amber-500 bg-amber-500/10' 
                                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                            }
                                          `}
                                        >
                                          <Star className={`w-4 h-4 ${isNorthStar ? 'fill-amber-500' : ''}`} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {isNorthStar ? 'Current North Star' : 'Set as North Star'}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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

      {/* Right Panel - AI Narrative (Collapsible) */}
      <AnimatePresence mode="wait">
        {isInsightsPanelOpen ? (
          <motion.div
            key="panel-open"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <AINarrativePanel
              narrative={frameworkData.aiNarrative || ""}
              selectedMetric={selectedMetric}
              isLoading={isLoading}
              onClose={() => setIsInsightsPanelOpen(false)}
              onMetricUpdate={(updated) => {
                setSelectedMetric(updated);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="panel-closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-12 border-l bg-card flex flex-col items-center py-4 gap-3"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsInsightsPanelOpen(true)}
              className="h-9 w-9"
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <MousePointerClick className="w-5 h-5 text-muted-foreground animate-pulse" />
              <p className="text-xs text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                Click a metric
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
