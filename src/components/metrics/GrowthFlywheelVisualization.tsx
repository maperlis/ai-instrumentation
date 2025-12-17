import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, ChevronRight, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { FlywheelLoop, MetricNode } from "@/types/metricsFramework";
import { ZoomControls } from "./ZoomControls";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GrowthFlywheelVisualizationProps {
  loops: FlywheelLoop[];
  northStarMetric?: MetricNode | null;
  onLoopSelect?: (loop: FlywheelLoop) => void;
  onMetricSelect?: (metric: MetricNode) => void;
  selectedLoopId?: string;
}

// Flywheel stage definitions with positions for circular layout
const flywheelStages = [
  {
    id: "richer-ai-context",
    label: "Richer AI Context",
    subtitle: "How structured and interpretable is the data for AI?",
    step: 1,
  },
  {
    id: "ai-model",
    label: "AI Model",
    subtitle: "Did the AI produce an output that was correct, complete, and required minimal manual correction?",
    step: 2,
  },
  {
    id: "more-consumption",
    label: "More Consumption",
    subtitle: "Where does AI replace manual work enough that users start to rely on it daily?",
    step: 3,
  },
  {
    id: "higher-activation",
    label: "Higher Activation",
    subtitle: "Which AI use cases create the strongest habit loops inside the product?",
    step: null, // Starting point
  },
  {
    id: "integrations",
    label: "Integrations",
    subtitle: "Are we bringing in the right data, and enough of it, to give the AI meaningful context?",
    step: null, // Starting point
  },
];

const howItWorksSteps = [
  {
    number: 1,
    text: "User actions and integrations feed the system with the context needed to understand work.",
    color: "bg-primary",
  },
  {
    number: 2,
    text: "Better context makes the AI's outputs more accurate and useful.",
    color: "bg-primary",
  },
  {
    number: 3,
    text: "More accurate AI drives higher activation and consumption across tasks, docs, and workflows.",
    color: "bg-primary",
  },
  {
    number: 4,
    text: "Increased usage generates richer data, which makes the AI even better and accelerates customer productivity.",
    color: "bg-emerald-500",
  },
];

export function GrowthFlywheelVisualization({
  loops,
  northStarMetric,
  onLoopSelect,
  onMetricSelect,
  selectedLoopId,
}: GrowthFlywheelVisualizationProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetView = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !selectedStage) {
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

  // Map loops to stages for data binding
  const getLoopForStage = (stageId: string) => {
    return loops.find((l) => l.id === stageId || l.name.toLowerCase().includes(stageId.split("-").join(" ")));
  };

  const selectedStageData = selectedStage ? loops.find((l) => l.id === selectedStage) : null;
  const selectedStageInfo = selectedStage ? flywheelStages.find((s) => s.id === selectedStage) : null;

  const handleStageClick = (stageId: string, loop?: FlywheelLoop) => {
    setSelectedStage(selectedStage === stageId ? null : stageId);
    if (loop) onLoopSelect?.(loop);
  };

  const handleBackdropClick = () => {
    if (selectedStage) {
      setSelectedStage(null);
    }
  };

  // Animation for dotted lines flowing
  const dashAnimation = {
    strokeDashoffset: [0, -20],
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: isPanning ? "grabbing" : selectedStage ? "default" : "grab",
      }}
    >
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onResetView={handleResetView} />

      {/* Title and How It Works Button */}
      <div className="absolute top-6 left-6 z-20 flex items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Growth Flywheel Framework</h2>
          <p className="text-sm text-muted-foreground mt-1">Click any stage to explore its metrics</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              How it Works
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                How the Flywheel Works
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white",
                      step.color,
                    )}
                  >
                    {step.number}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-1">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dimming overlay when a stage is selected */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 z-10"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Zoomable/Pannable Container */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Main flywheel container */}
        <div className="relative" style={{ width: "900px", height: "700px", transform: "translateX(-40px)" }}>
          {/* SVG for arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
            <defs>
              <marker id="arrow-primary" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.7" />
              </marker>
              <marker id="arrow-feedback" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" opacity="0.7" />
              </marker>
            </defs>

            {/* Arrow: Higher Activation → Richer AI Context (curved left side) */}
            <motion.path
              d="M 180 280 C 100 180, 180 60, 330 50"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-primary)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 1, delay: 0.2 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "higher-activation" && selectedStage !== "richer-ai-context"
                    ? 0.2
                    : 0.6,
              }}
            />

            {/* Arrow: Integrations → Richer AI Context (curved right side) */}
            <motion.path
              d="M 720 280 C 800 180, 720 60, 470 50"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-primary)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 1, delay: 0.3 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "integrations" && selectedStage !== "richer-ai-context"
                    ? 0.2
                    : 0.6,
              }}
            />

            {/* Arrow: Richer AI Context → AI Model */}
            <motion.path
              d="M 400 130 L 400 230"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-primary)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 0.6, delay: 0.5 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "richer-ai-context" && selectedStage !== "ai-model" ? 0.2 : 0.6,
              }}
            />

            {/* Arrow: AI Model → More Consumption */}
            <motion.path
              d="M 400 370 L 400 470"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-primary)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 0.6, delay: 0.7 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "ai-model" && selectedStage !== "more-consumption" ? 0.2 : 0.6,
              }}
            />

            {/* Arrow: More Consumption → Higher Activation (feedback loop left) */}
            <motion.path
              d="M 280 560 C 150 600, 80 450, 160 340"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-feedback)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 1, delay: 0.9 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "more-consumption" && selectedStage !== "higher-activation"
                    ? 0.2
                    : 0.6,
              }}
            />

            {/* Arrow: More Consumption → Integrations (feedback loop right) */}
            <motion.path
              d="M 520 560 C 650 600, 820 450, 740 340"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#arrow-feedback)"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                ...dashAnimation,
              }}
              transition={{
                pathLength: { duration: 1, delay: 1.1 },
                strokeDashoffset: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              style={{
                opacity:
                  selectedStage && selectedStage !== "more-consumption" && selectedStage !== "integrations" ? 0.2 : 0.6,
              }}
            />

            {/* Dotted line from More Consumption to North Star */}
            <motion.path
              d="M 520 530 L 620 530"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="4 3"
              markerEnd="url(#arrow-primary)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              style={{
                opacity: selectedStage && selectedStage !== "more-consumption" ? 0.2 : 0.6,
              }}
            />
          </svg>

          {/* Step number badges on arrows */}
          <StepBadge number={1} x={240} y={100} />
          <StepBadge number={1} x={560} y={100} />
          <StepBadge number={2} x={420} y={180} />
          <StepBadge number={3} x={420} y={420} />
          <StepBadge number={4} x={570} y={530} isFinal />

          {/* Stage: Richer AI Context (Top Center - shifted left) */}
          <FlywheelStageNode
            stage={flywheelStages[0]}
            loop={getLoopForStage("richer-ai-context") || loops[0]}
            isSelected={selectedStage === "richer-ai-context"}
            isDimmed={!!selectedStage && selectedStage !== "richer-ai-context"}
            onClick={(loop) => handleStageClick("richer-ai-context", loop)}
            style={{ position: "absolute", left: "280px", top: "0px" }}
          />

          {/* Stage: Higher Activation (Left) */}
          <FlywheelStageNode
            stage={flywheelStages[3]}
            loop={getLoopForStage("higher-activation") || loops[3]}
            isSelected={selectedStage === "higher-activation"}
            isDimmed={!!selectedStage && selectedStage !== "higher-activation"}
            onClick={(loop) => handleStageClick("higher-activation", loop)}
            style={{ position: "absolute", left: "30px", top: "250px" }}
          />

          {/* Stage: Integrations (Right) */}
          <FlywheelStageNode
            stage={flywheelStages[4]}
            loop={getLoopForStage("integrations") || loops[4]}
            isSelected={selectedStage === "integrations"}
            isDimmed={!!selectedStage && selectedStage !== "integrations"}
            onClick={(loop) => handleStageClick("integrations", loop)}
            style={{ position: "absolute", right: "30px", top: "250px" }}
          />

          {/* Stage: AI Model (Center - top touches arrow at y=230) */}
          <FlywheelStageNode
            stage={flywheelStages[1]}
            loop={getLoopForStage("ai-model") || loops[1]}
            isSelected={selectedStage === "ai-model"}
            isDimmed={!!selectedStage && selectedStage !== "ai-model"}
            onClick={(loop) => handleStageClick("ai-model", loop)}
            isCenter
            style={{ position: "absolute", left: "280px", top: "230px" }}
          />

          {/* Stage: More Consumption (Bottom - top touches arrow at y=470) */}
          <FlywheelStageNode
            stage={flywheelStages[2]}
            loop={getLoopForStage("more-consumption") || loops[2]}
            isSelected={selectedStage === "more-consumption"}
            isDimmed={!!selectedStage && selectedStage !== "more-consumption"}
            onClick={(loop) => handleStageClick("more-consumption", loop)}
            style={{ position: "absolute", left: "280px", top: "470px" }}
          />

          {/* North Star Section (Right Side) */}
          <motion.div
            className="absolute"
            style={{ right: "-20px", top: "480px" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              <span className="text-lg font-bold text-foreground">North Star</span>
            </div>

            {/* Customer ROI Box */}
            <motion.div
              className={cn(
                "border-2 border-primary rounded-xl p-4 bg-primary/5 cursor-pointer transition-all duration-200 w-52",
                "hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10",
              )}
              onClick={() => northStarMetric && onMetricSelect?.(northStarMetric)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {northStarMetric ? (
                <div>
                  <h4 className="font-bold text-foreground">{northStarMetric.name}</h4>
                  {northStarMetric.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{northStarMetric.description}</p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-foreground">Customer ROI</h4>
                  <p className="text-xs text-muted-foreground mt-1">Primary success indicator</p>
                </div>
              )}
            </motion.div>

            {/* Retention & Expansion Box */}
            <div className="border-2 border-emerald-500 rounded-xl p-4 bg-emerald-500/5 mt-3 w-52">
              <h4 className="font-semibold text-foreground text-sm">Retention & Expansion</h4>
              <p className="text-xs text-muted-foreground mt-1">(AI Credit Spend + Seat Expansion)</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Metrics Panel - shown when a stage is selected */}
      <AnimatePresence>
        {selectedStage && selectedStageData && (
          <motion.div
            initial={{ opacity: 0, x: 350 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 350 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 right-4 bottom-4 w-96 z-40 overflow-hidden"
          >
            <div className="bg-card border-2 border-border rounded-2xl shadow-2xl h-full flex flex-col">
              {/* Header */}
              <div className="p-5 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {selectedStageData.momentum && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium inline-block mb-2",
                          selectedStageData.momentum === "strong" && "bg-emerald-500/20 text-emerald-600",
                          selectedStageData.momentum === "medium" && "bg-amber-500/20 text-amber-600",
                          selectedStageData.momentum === "weak" && "bg-red-500/20 text-red-600",
                        )}
                      >
                        {selectedStageData.momentum} momentum
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-foreground">
                      {selectedStageInfo?.label || selectedStageData.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedStage(null)}
                    className="shrink-0 -mr-2 -mt-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {selectedStageInfo?.subtitle || selectedStageData.description}
                </p>
              </div>

              {/* Metrics List */}
              <div className="flex-1 overflow-auto p-5">
                {selectedStageData.metrics.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {selectedStageData.metrics.length} metric
                      {selectedStageData.metrics.length !== 1 ? "s" : ""} in this stage
                    </p>
                    {selectedStageData.metrics.map((metric, index) => (
                      <motion.div
                        key={metric.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onMetricSelect?.(metric)}
                        className="cursor-pointer"
                      >
                        <div className="p-4 rounded-xl border-2 border-border bg-background hover:border-primary/50 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate">{metric.name}</h4>
                              {metric.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{metric.description}</p>
                              )}
                              {metric.calculation && (
                                <p className="text-xs text-primary/80 mt-2 font-mono bg-primary/5 px-2 py-1 rounded">
                                  {metric.calculation}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                          </div>
                          {metric.status && (
                            <div className="mt-3 flex items-center gap-2">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  metric.status === "healthy" && "bg-emerald-500",
                                  metric.status === "warning" && "bg-amber-500",
                                  metric.status === "critical" && "bg-red-500",
                                )}
                              />
                              <span className="text-xs text-muted-foreground capitalize">{metric.status}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-foreground mb-2">No metrics yet</h4>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Metrics for this stage will appear here once added.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Step badge component for numbered indicators
function StepBadge({ number, x, y, isFinal = false }: { number: number; x: number; y: number; isFinal?: boolean }) {
  return (
    <motion.div
      className={cn(
        "absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md z-30",
        isFinal ? "bg-emerald-500" : "bg-primary",
      )}
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5 + number * 0.1, type: "spring" }}
    >
      {number}
    </motion.div>
  );
}

// Flywheel Stage Node Component
interface FlywheelStageNodeProps {
  stage: (typeof flywheelStages)[0];
  loop?: FlywheelLoop;
  isSelected: boolean;
  isDimmed: boolean;
  isCenter?: boolean;
  onClick: (loop?: FlywheelLoop) => void;
  style: React.CSSProperties;
}

function FlywheelStageNode({ stage, loop, isSelected, isDimmed, isCenter, onClick, style }: FlywheelStageNodeProps) {
  const metricsCount = loop?.metrics?.length || 0;

  return (
    <motion.div
      className={cn(
        "bg-card rounded-xl cursor-pointer transition-all duration-300 z-20",
        isCenter ? "w-56 border-2 shadow-lg" : "w-52 border-2",
        isSelected && "ring-4 ring-primary/30 border-primary shadow-xl shadow-primary/20",
        isDimmed && "opacity-30",
        !isSelected && !isDimmed && "hover:border-primary/50 hover:shadow-lg",
        "border-border",
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick(loop);
      }}
      whileHover={!isDimmed ? { scale: 1.03 } : {}}
      whileTap={!isDimmed ? { scale: 0.98 } : {}}
      animate={{
        opacity: isDimmed ? 0.3 : 1,
      }}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, scale: 0.9 }}
    >
      <div className={cn("p-4", isCenter && "p-5")}>
        <h4 className={cn("font-bold text-foreground leading-tight", isCenter ? "text-base" : "text-sm")}>
          {stage.label}
        </h4>
        <p className={cn("text-muted-foreground mt-2 leading-relaxed", isCenter ? "text-xs" : "text-xs")}>
          {stage.subtitle}
        </p>

        {/* Metrics count indicator */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", metricsCount > 0 ? "bg-primary" : "bg-muted-foreground/30")} />
            <span className={cn("text-xs font-medium", metricsCount > 0 ? "text-primary" : "text-muted-foreground")}>
              {metricsCount} metric{metricsCount !== 1 ? "s" : ""}
            </span>
          </div>
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              isSelected ? "text-primary rotate-90" : "text-muted-foreground",
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}
