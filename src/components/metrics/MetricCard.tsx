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
    up: <TrendingUp className="w-3.5 h-3.5" />,
    down: <TrendingDown className="w-3.5 h-3.5" />,
    stable: <Minus className="w-3.5 h-3.5" />,
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
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative rounded-xl border-2 transition-all cursor-pointer",
          "bg-card shadow-md hover:shadow-lg",
          metric.isNorthStar 
            ? "border-primary bg-gradient-to-br from-primary/5 via-card to-secondary/5 ring-2 ring-primary/20 shadow-lg" 
            : "border-border hover:border-primary/50",
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* North Star Badge */}
        {metric.isNorthStar && (
          <div className="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base",
              metric.isNorthStar && "text-primary"
            )}>
              {metric.name}
            </h4>
            {!compact && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {metric.description}
              </p>
            )}
          </div>

          {showInfluence && metric.influenceDescription && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-3">
                <p className="text-sm leading-relaxed">{metric.influenceDescription}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Value & Trend */}
        {(metric.currentValue !== undefined || metric.trend) && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
            {metric.currentValue !== undefined && (
              <span className={cn(
                "font-bold tabular-nums",
                compact ? "text-xl" : "text-2xl"
              )}>
                {typeof metric.currentValue === 'number' 
                  ? metric.currentValue.toLocaleString() 
                  : metric.currentValue}
              </span>
            )}
            
            {metric.trend && (
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-md",
                metric.trend === 'up' && "bg-success/10",
                metric.trend === 'down' && "bg-destructive/10",
                metric.trend === 'stable' && "bg-muted",
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
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-3",
            statusColors[metric.status]
          )}>
            {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
          </div>
        )}

        {/* Category Tag */}
        {!compact && metric.category && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
              {metric.category}
            </span>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
});
