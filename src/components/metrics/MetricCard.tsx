import { memo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Star, Info } from "lucide-react";
import { MetricNode } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  metric: MetricNode;
  isSelected?: boolean;
  onClick?: () => void;
  showInfluence?: boolean;
  compact?: boolean;
}

export const MetricCard = memo(function MetricCard({
  metric,
  isSelected,
  onClick,
  showInfluence,
  compact = false,
}: MetricCardProps) {
  const statusColors = {
    healthy: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/10 border-warning/30 text-warning",
    critical: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    stable: <Minus className="w-3 h-3" />,
  };

  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    stable: "text-muted-foreground",
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative rounded-xl border-2 transition-all cursor-pointer",
          "bg-card shadow-sm hover:shadow-md",
          metric.isNorthStar 
            ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5 ring-2 ring-primary/20" 
            : "border-border hover:border-primary/50",
          isSelected && "ring-2 ring-primary",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* North Star Badge */}
        {metric.isNorthStar && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold truncate",
              compact ? "text-xs" : "text-sm",
              metric.isNorthStar && "text-primary"
            )}>
              {metric.name}
            </h4>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {metric.description}
              </p>
            )}
          </div>

          {showInfluence && metric.influenceDescription && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{metric.influenceDescription}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Value & Trend */}
        {(metric.currentValue !== undefined || metric.trend) && (
          <div className="flex items-center justify-between mt-3">
            {metric.currentValue !== undefined && (
              <span className={cn(
                "font-bold",
                compact ? "text-lg" : "text-xl"
              )}>
                {typeof metric.currentValue === 'number' 
                  ? metric.currentValue.toLocaleString() 
                  : metric.currentValue}
              </span>
            )}
            
            {metric.trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendColors[metric.trend]
              )}>
                {trendIcon[metric.trend]}
                {metric.trendPercentage !== undefined && (
                  <span>{metric.trendPercentage > 0 ? '+' : ''}{metric.trendPercentage}%</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Badge */}
        {metric.status && (
          <div className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2",
            statusColors[metric.status]
          )}>
            {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
          </div>
        )}

        {/* Category Tag */}
        {!compact && metric.category && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
              {metric.category}
            </span>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
});
