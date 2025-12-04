import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { FunnelStage, MetricNode } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";

interface ConversionFunnelVisualizationProps {
  stages: FunnelStage[];
  northStarMetric?: MetricNode | null;
  onStageSelect?: (stage: FunnelStage) => void;
  onMetricHighlight?: (metricIds: string[]) => void;
}

export function ConversionFunnelVisualization({
  stages,
  northStarMetric,
  onStageSelect,
  onMetricHighlight,
}: ConversionFunnelVisualizationProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const maxCount = Math.max(...stages.map(s => s.count || 0), 1);

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3 text-success" />,
    down: <TrendingDown className="w-3 h-3 text-destructive" />,
    stable: <Minus className="w-3 h-3 text-muted-foreground" />,
  };

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-auto">
      {/* North Star Header */}
      {northStarMetric && (
        <div className="mb-8 text-center">
          <MetricCard metric={northStarMetric} compact />
        </div>
      )}

      {/* Funnel Stages */}
      <div className="flex-1 flex flex-col items-center gap-2">
        {stages.map((stage, index) => {
          const width = Math.max(30, ((stage.count || 0) / maxCount) * 100);
          const isExpanded = expandedStage === stage.id;
          const isHovered = hoveredStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              className="w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Stage Bar */}
              <motion.div
                className={cn(
                  "relative cursor-pointer transition-all rounded-lg overflow-hidden",
                  "border-2 border-transparent",
                  isExpanded && "border-primary"
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background */}
                <div 
                  className={cn(
                    "h-16 rounded-lg transition-colors",
                    isHovered || isExpanded
                      ? "bg-primary/20"
                      : "bg-gradient-to-r from-primary/10 to-secondary/10"
                  )}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{stage.name}</h4>
                      {stage.count !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {stage.count.toLocaleString()} users
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Conversion Rate */}
                    {stage.conversionRate !== undefined && (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">
                            {stage.conversionRate.toFixed(1)}%
                          </span>
                          {stage.trend && trendIcon[stage.trend]}
                        </div>
                        <p className="text-xs text-muted-foreground">conversion</p>
                      </div>
                    )}

                    {/* Expand Icon */}
                    {stage.driverMetrics.length > 0 && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Drop-off indicator */}
              {index < stages.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="w-0.5 h-4 bg-border" />
                </div>
              )}

              {/* Expanded Driver Metrics */}
              <AnimatePresence>
                {isExpanded && stage.driverMetrics.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 pb-2">
                      <p className="text-xs text-muted-foreground mb-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Metrics influencing this stage
                        </span>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {stage.driverMetrics.map(metric => (
                          <MetricCard
                            key={metric.id}
                            metric={metric}
                            compact
                            showInfluence
                          />
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No funnel stages</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Add metrics to visualize your conversion funnel from visitors to advocates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing import
import { Sparkles } from "lucide-react";
