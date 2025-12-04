import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Users, Sparkles } from "lucide-react";
import { FunnelStage, MetricNode } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";

interface ConversionFunnelVisualizationProps {
  stages: FunnelStage[];
  northStarMetric?: MetricNode | null;
  onStageSelect?: (stage: FunnelStage) => void;
  onMetricHighlight?: (metricIds: string[]) => void;
  onMetricSelect?: (metric: MetricNode) => void;
}

export function ConversionFunnelVisualization({
  stages,
  northStarMetric,
  onStageSelect,
  onMetricHighlight,
  onMetricSelect,
}: ConversionFunnelVisualizationProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const maxCount = Math.max(...stages.map(s => s.count || 0), 1);

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-success" />,
    down: <TrendingDown className="w-4 h-4 text-destructive" />,
    stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-auto bg-gradient-to-b from-background to-muted/20">
      {/* North Star Header */}
      {northStarMetric && (
        <div className="mb-10 flex justify-center">
          <div className="max-w-xs">
            <MetricCard metric={northStarMetric} />
          </div>
        </div>
      )}

      {/* Funnel Stages */}
      <div className="flex-1 flex flex-col items-center gap-3 max-w-3xl mx-auto w-full">
        {stages.map((stage, index) => {
          const width = Math.max(40, ((stage.count || 0) / maxCount) * 100);
          const isExpanded = expandedStage === stage.id;
          const isHovered = hoveredStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Stage Bar */}
              <motion.div
                className={cn(
                  "relative cursor-pointer transition-all rounded-2xl overflow-hidden",
                  "border-2",
                  isExpanded ? "border-primary shadow-lg" : "border-transparent",
                  isHovered && !isExpanded && "border-primary/30"
                )}
                style={{ width: `${width}%`, margin: '0 auto' }}
                onMouseEnter={() => {
                  setHoveredStage(stage.id);
                  onMetricHighlight?.(stage.driverMetrics.map(m => m.id));
                }}
                onMouseLeave={() => {
                  setHoveredStage(null);
                  onMetricHighlight?.([]);
                }}
                onClick={() => {
                  setExpandedStage(isExpanded ? null : stage.id);
                  onStageSelect?.(stage);
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Background */}
                <div 
                  className={cn(
                    "h-20 rounded-2xl transition-all",
                    isHovered || isExpanded
                      ? "bg-gradient-to-r from-primary/20 to-secondary/20"
                      : "bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10"
                  )}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm border">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">{stage.name}</h4>
                      {stage.count !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          {stage.count.toLocaleString()} users
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Conversion Rate */}
                    {stage.conversionRate !== undefined && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold tabular-nums">
                            {stage.conversionRate.toFixed(1)}%
                          </span>
                          {stage.trend && trendIcon[stage.trend]}
                        </div>
                        <p className="text-xs text-muted-foreground">conversion rate</p>
                      </div>
                    )}

                    {/* Expand Icon */}
                    {stage.driverMetrics.length > 0 && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg bg-background/50"
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Drop-off indicator */}
              {index < stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-border to-transparent rounded-full" />
                </div>
              )}

              {/* Expanded Driver Metrics */}
              <AnimatePresence>
                {isExpanded && stage.driverMetrics.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 pb-4 px-4">
                      <p className="text-sm text-muted-foreground mb-4 text-center flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Metrics influencing this stage
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        {stage.driverMetrics.map(metric => (
                          <div 
                            key={metric.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMetricSelect?.(metric);
                            }}
                            className="cursor-pointer"
                          >
                            <MetricCard
                              metric={metric}
                              compact
                              showInfluence
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {stages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No funnel stages</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Add metrics to visualize your conversion funnel from visitors to advocates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
