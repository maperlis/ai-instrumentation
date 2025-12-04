import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { FlywheelLoop, MetricNode } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";

interface GrowthFlywheelVisualizationProps {
  loops: FlywheelLoop[];
  northStarMetric?: MetricNode | null;
  onLoopSelect?: (loop: FlywheelLoop) => void;
  selectedLoopId?: string;
}

export function GrowthFlywheelVisualization({
  loops,
  northStarMetric,
  onLoopSelect,
  selectedLoopId,
}: GrowthFlywheelVisualizationProps) {
  const [hoveredLoop, setHoveredLoop] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const momentumColors = {
    strong: "from-success/30 to-success/10",
    medium: "from-warning/30 to-warning/10",
    weak: "from-muted/30 to-muted/10",
  };

  const momentumBorders = {
    strong: "border-success/50",
    medium: "border-warning/50",
    weak: "border-muted-foreground/30",
  };

  const momentumAnimations = {
    strong: { rotate: 360, transition: { duration: 20, repeat: Infinity, ease: "linear" } },
    medium: { rotate: 360, transition: { duration: 40, repeat: Infinity, ease: "linear" } },
    weak: { rotate: 360, transition: { duration: 80, repeat: Infinity, ease: "linear" } },
  };

  // Calculate positions for loops around the center
  const calculateLoopPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-8 overflow-hidden"
    >
      <div className="relative w-[600px] h-[600px]">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle ring */}
        <div className="absolute inset-12 rounded-full border border-primary/10" />

        {/* Center - North Star Metric */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {northStarMetric ? (
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150" />
                <MetricCard metric={northStarMetric} />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">North Star</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Flywheel Loops */}
        {loops.map((loop, index) => {
          const pos = calculateLoopPosition(index, loops.length, 220);
          const isHovered = hoveredLoop === loop.id;
          const isSelected = selectedLoopId === loop.id;

          return (
            <motion.div
              key={loop.id}
              className="absolute"
              style={{
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {/* Loop segment */}
              <motion.div
                className={cn(
                  "relative cursor-pointer transition-all",
                  "w-36 h-36 rounded-full",
                  "bg-gradient-to-br",
                  momentumColors[loop.momentum],
                  "border-2",
                  momentumBorders[loop.momentum],
                  (isHovered || isSelected) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onMouseEnter={() => setHoveredLoop(loop.id)}
                onMouseLeave={() => setHoveredLoop(null)}
                onClick={() => onLoopSelect?.(loop)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Momentum indicator - rotating ring */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-transparent",
                    loop.momentum === 'strong' && "border-t-success/50",
                    loop.momentum === 'medium' && "border-t-warning/50",
                    loop.momentum === 'weak' && "border-t-muted-foreground/30",
                  )}
                  animate={momentumAnimations[loop.momentum]}
                />

                {/* Loop content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                  <Zap className={cn(
                    "w-5 h-5 mb-1",
                    loop.momentum === 'strong' && "text-success",
                    loop.momentum === 'medium' && "text-warning",
                    loop.momentum === 'weak' && "text-muted-foreground",
                  )} />
                  <h4 className="font-semibold text-xs leading-tight">{loop.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">
                    {loop.momentum} momentum
                  </p>
                </div>
              </motion.div>

              {/* Connector line to center */}
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  width: Math.abs(pos.x) + 100,
                  height: Math.abs(pos.y) + 100,
                  transform: `translate(-50%, -50%)`,
                  overflow: 'visible',
                }}
              >
                <line
                  x1="50%"
                  y1="50%"
                  x2={pos.x > 0 ? '0%' : '100%'}
                  y2={pos.y > 0 ? '0%' : '100%'}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={0.3}
                />
              </svg>

              {/* Expanded metrics on hover/select */}
              <AnimatePresence>
                {(isHovered || isSelected) && loop.metrics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30"
                  >
                    <div className="bg-card border rounded-lg shadow-lg p-3 min-w-[200px]">
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {loop.description}
                      </p>
                      <div className="space-y-2">
                        {loop.metrics.slice(0, 3).map(metric => (
                          <MetricCard
                            key={metric.id}
                            metric={metric}
                            compact
                          />
                        ))}
                        {loop.metrics.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{loop.metrics.length - 3} more metrics
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {loops.length === 0 && !northStarMetric && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No growth loops</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Add metrics to visualize your growth flywheel and feedback loops.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Loop Momentum</p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-success/50" />
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-warning/50" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>Weak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
