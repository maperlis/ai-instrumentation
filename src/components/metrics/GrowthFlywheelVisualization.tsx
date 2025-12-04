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
    strong: "from-success/20 to-success/5",
    medium: "from-warning/20 to-warning/5",
    weak: "from-muted/20 to-muted/5",
  };

  const momentumBorders = {
    strong: "border-success/40",
    medium: "border-warning/40",
    weak: "border-muted-foreground/20",
  };

  const momentumAnimations = {
    strong: { rotate: 360, transition: { duration: 15, repeat: Infinity, ease: "linear" } },
    medium: { rotate: 360, transition: { duration: 30, repeat: Infinity, ease: "linear" } },
    weak: { rotate: 360, transition: { duration: 60, repeat: Infinity, ease: "linear" } },
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
      className="w-full h-full flex items-center justify-center p-10 overflow-hidden bg-gradient-to-b from-background to-muted/20"
    >
      <div className="relative w-[700px] h-[700px]">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle ring */}
        <div className="absolute inset-16 rounded-full border border-primary/5" />

        {/* Center - North Star Metric */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative z-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {northStarMetric ? (
              <div className="relative max-w-[260px]">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-2xl scale-150" />
                <MetricCard metric={northStarMetric} />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-2 border-primary/20 shadow-lg">
                <div className="text-center">
                  <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">North Star</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Flywheel Loops */}
        {loops.map((loop, index) => {
          const pos = calculateLoopPosition(index, loops.length, 260);
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
              transition={{ delay: index * 0.15 + 0.3 }}
            >
              {/* Loop segment */}
              <motion.div
                className={cn(
                  "relative cursor-pointer transition-all",
                  "w-40 h-40 rounded-full",
                  "bg-gradient-to-br",
                  momentumColors[loop.momentum],
                  "border-2",
                  momentumBorders[loop.momentum],
                  (isHovered || isSelected) && "ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-xl"
                )}
                onMouseEnter={() => setHoveredLoop(loop.id)}
                onMouseLeave={() => setHoveredLoop(null)}
                onClick={() => onLoopSelect?.(loop)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Momentum indicator - rotating ring */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full border-[3px] border-transparent",
                    loop.momentum === 'strong' && "border-t-success/60",
                    loop.momentum === 'medium' && "border-t-warning/60",
                    loop.momentum === 'weak' && "border-t-muted-foreground/30",
                  )}
                  animate={momentumAnimations[loop.momentum]}
                />

                {/* Loop content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <Zap className={cn(
                    "w-6 h-6 mb-2",
                    loop.momentum === 'strong' && "text-success",
                    loop.momentum === 'medium' && "text-warning",
                    loop.momentum === 'weak' && "text-muted-foreground",
                  )} />
                  <h4 className="font-semibold text-sm leading-tight">{loop.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 capitalize">
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
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  opacity={0.2}
                />
              </svg>

              {/* Expanded metrics on hover/select */}
              <AnimatePresence>
                {(isHovered || isSelected) && loop.metrics.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-30"
                  >
                    <div className="bg-card border-2 rounded-xl shadow-xl p-4 min-w-[240px]">
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {loop.description}
                      </p>
                      <div className="space-y-3">
                        {loop.metrics.slice(0, 3).map(metric => (
                          <MetricCard
                            key={metric.id}
                            metric={metric}
                            compact
                          />
                        ))}
                        {loop.metrics.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
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
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No growth loops</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                Add metrics to visualize your growth flywheel and feedback loops.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 border shadow-lg">
        <p className="text-xs font-semibold mb-3 text-foreground">Loop Momentum</p>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-success/40 to-success/10 border border-success/40" />
            <span className="text-muted-foreground">Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-warning/40 to-warning/10 border border-warning/40" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-muted/40 to-muted/10 border border-muted-foreground/30" />
            <span className="text-muted-foreground">Weak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
