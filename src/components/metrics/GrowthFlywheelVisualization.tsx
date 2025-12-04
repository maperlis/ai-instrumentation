import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ZoomIn, ZoomOut, Move, X } from "lucide-react";
import { FlywheelLoop, MetricNode } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface GrowthFlywheelVisualizationProps {
  loops: FlywheelLoop[];
  northStarMetric?: MetricNode | null;
  onLoopSelect?: (loop: FlywheelLoop) => void;
  onMetricSelect?: (metric: MetricNode) => void;
  selectedLoopId?: string;
}

export function GrowthFlywheelVisualization({
  loops,
  northStarMetric,
  onLoopSelect,
  onMetricSelect,
  selectedLoopId,
}: GrowthFlywheelVisualizationProps) {
  const [expandedLoop, setExpandedLoop] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleResetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const selectedLoopData = loops.find(l => l.id === expandedLoop);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-gradient-to-b from-background to-muted/20"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Zoom/Pan Controls */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleResetView} title="Reset View">
          <Move className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoomable/Pannable Container */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
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
            const isExpanded = expandedLoop === loop.id;
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
                    "w-44 h-44 rounded-full",
                    "bg-gradient-to-br",
                    momentumColors[loop.momentum],
                    "border-2",
                    momentumBorders[loop.momentum],
                    (isExpanded || isSelected) && "ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-xl"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedLoop(isExpanded ? null : loop.id);
                    onLoopSelect?.(loop);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
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
                      {loop.momentum} · {loop.metrics.length} metrics
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
      </div>

      {/* Fixed Metrics Side Panel */}
      <AnimatePresence>
        {expandedLoop && selectedLoopData && selectedLoopData.metrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-20 bottom-4 w-80 z-30 overflow-hidden"
          >
            <div className="bg-card border-2 rounded-xl shadow-xl h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedLoopData.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{selectedLoopData.momentum} momentum</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setExpandedLoop(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground px-4 pt-3 pb-2 leading-relaxed">
                {selectedLoopData.description}
              </p>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {selectedLoopData.metrics.map(metric => (
                  <div 
                    key={metric.id}
                    onClick={() => onMetricSelect?.(metric)}
                    className="cursor-pointer hover:scale-[1.02] transition-transform"
                  >
                    <MetricCard
                      metric={metric}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 border shadow-lg z-30">
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
