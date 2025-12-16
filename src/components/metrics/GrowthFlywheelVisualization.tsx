import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { FlywheelLoop, MetricNode } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { ZoomControls } from "./ZoomControls";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface GrowthFlywheelVisualizationProps {
  loops: FlywheelLoop[];
  northStarMetric?: MetricNode | null;
  onLoopSelect?: (loop: FlywheelLoop) => void;
  onMetricSelect?: (metric: MetricNode) => void;
  selectedLoopId?: string;
}

// Flywheel stage definitions
const flywheelStages = [
  {
    id: "richer-ai-context",
    label: "Richer AI Context",
    subtitle: "How structured and interpretable is the data for AI?",
    position: "top",
    angle: -90,
    successIndicator: "Data quality, semantic structure, metadata availability",
  },
  {
    id: "integrations",
    label: "Integrations",
    subtitle: "Are we bringing in the right data, and enough of it?",
    position: "right",
    angle: -30,
    successIndicator: "Product instrumentation, third-party data ingestion",
  },
  {
    id: "ai-model",
    label: "AI Model",
    subtitle: "Did the AI produce correct, complete output?",
    position: "center",
    angle: 0,
    successIndicator: "Model accuracy, output reliability, minimal corrections",
  },
  {
    id: "more-consumption",
    label: "More Consumption",
    subtitle: "Where does AI replace manual work enough to rely on daily?",
    position: "bottom",
    angle: 90,
    successIndicator: "AI feature usage, task replacement, workflow adoption",
  },
  {
    id: "higher-activation",
    label: "Higher Activation",
    subtitle: "Which AI use cases create the strongest habit loops?",
    position: "left",
    angle: 210,
    successIndicator: "Activation moments, habit formation, repeat usage",
  },
];

const howItWorksSteps = [
  { text: "User actions and integrations feed context", from: "Integrations" },
  { text: "Better context improves AI accuracy", from: "AI Model" },
  { text: "Higher quality drives more consumption", from: "Consumption" },
  { text: "Increased usage generates richer data", from: "Data Loop" },
];

export function GrowthFlywheelVisualization({
  loops,
  northStarMetric,
  onLoopSelect,
  onMetricSelect,
  selectedLoopId,
}: GrowthFlywheelVisualizationProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleResetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !expandedStage) {
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
    return loops.find(l => l.id === stageId || l.name.toLowerCase().includes(stageId.split('-').join(' ')));
  };

  const selectedStageData = expandedStage ? loops.find(l => l.id === expandedStage) : null;
  const selectedStage = expandedStage ? flywheelStages.find(s => s.id === expandedStage) : null;

  const handleStageClick = (stageId: string, loop?: FlywheelLoop) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
    if (loop) onLoopSelect?.(loop);
  };

  const handleBackdropClick = () => {
    if (expandedStage) {
      setExpandedStage(null);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : expandedStage ? 'default' : 'grab' }}
    >
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Title */}
      <div className="absolute top-6 left-6 z-20">
        <h2 className="text-2xl font-bold text-foreground">AI Growth Flywheel Framework</h2>
        <p className="text-sm text-muted-foreground mt-1">Click any stage to explore its metrics</p>
      </div>

      {/* Dimming overlay when a stage is selected */}
      <AnimatePresence>
        {expandedStage && (
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
        className="w-full h-full flex items-start justify-center pt-16"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div className="relative flex gap-12">
          {/* How It Works Section */}
          <div className="w-72 pt-28 shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">How it Works</h3>
            </div>
            <div className="relative">
              {/* Dotted connector line */}
              <div className="absolute left-[14px] top-7 bottom-7 w-0.5 border-l-2 border-dashed border-muted-foreground/20" />
              
              <div className="space-y-6">
                {howItWorksSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold relative z-10 shadow-md",
                      index < 3 ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
                    )}>
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm text-foreground font-medium leading-relaxed">{step.text}</p>
                      <span className="text-xs text-muted-foreground">{step.from}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Flywheel Visualization */}
          <div className="relative w-[780px] h-[620px]">
            {/* SVG Connections with stronger arrows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--primary))"
                    opacity="0.6"
                  />
                </marker>
                <marker
                  id="arrowhead-muted"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--muted-foreground))"
                    opacity="0.4"
                  />
                </marker>
              </defs>

              {/* Clockwise flow arrows - stronger and more visible */}
              {/* 1: Richer AI Context → Integrations */}
              <motion.path
                d="M 420 80 Q 560 40 600 200"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: expandedStage && expandedStage !== 'richer-ai-context' && expandedStage !== 'integrations' ? 0.15 : 0.5 
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
              
              {/* 2: Integrations → AI Model */}
              <motion.path
                d="M 560 290 Q 500 340 420 360"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: expandedStage && expandedStage !== 'integrations' && expandedStage !== 'ai-model' ? 0.15 : 0.5 
                }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
              
              {/* 3: AI Model → More Consumption */}
              <motion.path
                d="M 390 420 Q 390 480 390 510"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: expandedStage && expandedStage !== 'ai-model' && expandedStage !== 'more-consumption' ? 0.15 : 0.5 
                }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
              
              {/* 4: More Consumption → Higher Activation (dashed - feedback loop) */}
              <motion.path
                d="M 300 540 Q 100 480 160 300"
                fill="none"
                stroke="hsl(var(--emerald-500, 16 185 129))"
                strokeWidth="2.5"
                strokeDasharray="8 4"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: expandedStage && expandedStage !== 'more-consumption' && expandedStage !== 'higher-activation' ? 0.15 : 0.5 
                }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="[&>polygon]:fill-emerald-500"
              />
              
              {/* 5: Higher Activation → Richer AI Context (completing the loop) */}
              <motion.path
                d="M 180 200 Q 100 60 340 60"
                fill="none"
                stroke="hsl(var(--emerald-500, 16 185 129))"
                strokeWidth="2.5"
                strokeDasharray="8 4"
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: expandedStage && expandedStage !== 'higher-activation' && expandedStage !== 'richer-ai-context' ? 0.15 : 0.5 
                }}
                transition={{ duration: 0.8, delay: 1 }}
              />
            </svg>

            {/* Stage: Richer AI Context (Top) */}
            <motion.div
              className="absolute z-20"
              style={{ left: '50%', top: '10px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StageNode
                stage={flywheelStages[0]}
                loop={getLoopForStage('richer-ai-context') || loops[0]}
                isExpanded={expandedStage === flywheelStages[0].id}
                isSelected={selectedLoopId === flywheelStages[0].id}
                isDimmed={!!expandedStage && expandedStage !== flywheelStages[0].id}
                stepNumber={1}
                onClick={(loop) => handleStageClick(flywheelStages[0].id, loop)}
              />
            </motion.div>

            {/* Stage: Integrations (Right) */}
            <motion.div
              className="absolute z-20"
              style={{ right: '20px', top: '180px' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StageNode
                stage={flywheelStages[1]}
                loop={getLoopForStage('integrations') || loops[1]}
                isExpanded={expandedStage === flywheelStages[1].id}
                isSelected={selectedLoopId === flywheelStages[1].id}
                isDimmed={!!expandedStage && expandedStage !== flywheelStages[1].id}
                stepNumber={2}
                onClick={(loop) => handleStageClick(flywheelStages[1].id, loop)}
              />
            </motion.div>

            {/* Stage: AI Model (Center) */}
            <motion.div
              className="absolute z-20"
              style={{ left: '50%', top: '300px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StageNode
                stage={flywheelStages[2]}
                loop={getLoopForStage('ai-model') || loops[2]}
                isExpanded={expandedStage === flywheelStages[2].id}
                isSelected={selectedLoopId === flywheelStages[2].id}
                isDimmed={!!expandedStage && expandedStage !== flywheelStages[2].id}
                isCenter
                onClick={(loop) => handleStageClick(flywheelStages[2].id, loop)}
              />
            </motion.div>

            {/* Stage: More Consumption (Bottom) */}
            <motion.div
              className="absolute z-20"
              style={{ left: '50%', bottom: '10px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StageNode
                stage={flywheelStages[3]}
                loop={getLoopForStage('more-consumption') || loops[3]}
                isExpanded={expandedStage === flywheelStages[3].id}
                isSelected={selectedLoopId === flywheelStages[3].id}
                isDimmed={!!expandedStage && expandedStage !== flywheelStages[3].id}
                stepNumber={3}
                onClick={(loop) => handleStageClick(flywheelStages[3].id, loop)}
              />
            </motion.div>

            {/* Stage: Higher Activation (Left) */}
            <motion.div
              className="absolute z-20"
              style={{ left: '20px', top: '180px' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <StageNode
                stage={flywheelStages[4]}
                loop={getLoopForStage('higher-activation') || loops[4]}
                isExpanded={expandedStage === flywheelStages[4].id}
                isSelected={selectedLoopId === flywheelStages[4].id}
                isDimmed={!!expandedStage && expandedStage !== flywheelStages[4].id}
                stepNumber={4}
                isFeedbackLoop
                onClick={(loop) => handleStageClick(flywheelStages[4].id, loop)}
              />
            </motion.div>
          </div>

          {/* North Star Section (Right) */}
          <div className="w-72 pt-64 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {/* Dotted line from flywheel to North Star */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border-t-2 border-dashed border-primary/40" />
                <ArrowRight className="w-5 h-5 text-primary/60" />
              </div>

              <div className="flex items-center gap-3">
                <Star className="w-7 h-7 fill-amber-400 text-amber-500" />
                <span className="text-xl font-bold text-foreground">North Star</span>
              </div>

              {/* Customer ROI Box */}
              <motion.div 
                className={cn(
                  "border-2 border-primary rounded-xl p-5 bg-primary/5 cursor-pointer transition-all duration-200",
                  "hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10"
                )}
                onClick={() => northStarMetric && onMetricSelect?.(northStarMetric)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {northStarMetric ? (
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{northStarMetric.name}</h4>
                    {northStarMetric.description && (
                      <p className="text-sm text-muted-foreground mt-2">{northStarMetric.description}</p>
                    )}
                    {northStarMetric.currentValue && (
                      <p className="text-sm font-medium text-primary mt-2">{northStarMetric.currentValue}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-bold text-lg text-foreground">Customer ROI</h4>
                    <p className="text-sm text-muted-foreground mt-2">Primary success indicator</p>
                  </div>
                )}
              </motion.div>

              {/* Retention & Expansion Box */}
              <div className="border-2 border-emerald-500 rounded-xl p-5 bg-emerald-500/5">
                <h4 className="font-bold text-foreground">Retention & Expansion</h4>
                <p className="text-sm text-muted-foreground mt-2">(AI Credit Spend + Seat Expansion)</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Metrics Panel - shown when a stage is expanded */}
      <AnimatePresence>
        {expandedStage && selectedStageData && (
          <motion.div
            initial={{ opacity: 0, x: 350 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 350 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 right-20 bottom-4 w-96 z-40 overflow-hidden"
          >
            <div className="bg-card border-2 border-border rounded-2xl shadow-2xl h-full flex flex-col">
              {/* Header */}
              <div className="p-5 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedStageData.momentum && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          selectedStageData.momentum === 'strong' && "bg-emerald-500/20 text-emerald-600",
                          selectedStageData.momentum === 'medium' && "bg-amber-500/20 text-amber-600",
                          selectedStageData.momentum === 'weak' && "bg-red-500/20 text-red-600",
                        )}>
                          {selectedStageData.momentum} momentum
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{selectedStage?.label || selectedStageData.name}</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setExpandedStage(null)}
                    className="shrink-0 -mr-2 -mt-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {selectedStage?.subtitle || selectedStageData.description}
                </p>
                {selectedStage?.successIndicator && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Success indicators</p>
                    <p className="text-sm text-foreground">{selectedStage.successIndicator}</p>
                  </div>
                )}
              </div>

              {/* Metrics List */}
              <div className="flex-1 overflow-auto p-5">
                {selectedStageData.metrics.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {selectedStageData.metrics.length} metric{selectedStageData.metrics.length !== 1 ? 's' : ''} in this stage
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
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                metric.status === 'healthy' && "bg-emerald-500",
                                metric.status === 'warning' && "bg-amber-500",
                                metric.status === 'critical' && "bg-red-500",
                              )} />
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

// Stage Node Component
interface StageNodeProps {
  stage: typeof flywheelStages[0];
  loop?: FlywheelLoop;
  isExpanded: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  isCenter?: boolean;
  stepNumber?: number;
  isFeedbackLoop?: boolean;
  onClick: (loop?: FlywheelLoop) => void;
}

function StageNode({ 
  stage, 
  loop, 
  isExpanded, 
  isSelected, 
  isDimmed,
  isCenter, 
  stepNumber,
  isFeedbackLoop,
  onClick 
}: StageNodeProps) {
  const hasMetrics = loop && loop.metrics.length > 0;
  
  return (
    <motion.div
      className={cn(
        "relative bg-card rounded-2xl cursor-pointer transition-all duration-300",
        isCenter ? "w-[220px] border-2 shadow-xl" : "w-[200px] border-2",
        isExpanded && "ring-4 ring-primary/30 border-primary shadow-xl shadow-primary/20 scale-105",
        isSelected && !isExpanded && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDimmed && "opacity-30 scale-95",
        !isExpanded && !isDimmed && "hover:border-primary/50 hover:shadow-lg",
        isFeedbackLoop ? "border-emerald-500/50" : "border-border",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick(loop);
      }}
      whileHover={!isDimmed ? { scale: isExpanded ? 1.05 : 1.03 } : {}}
      whileTap={!isDimmed ? { scale: 0.98 } : {}}
      animate={{
        opacity: isDimmed ? 0.3 : 1,
        scale: isDimmed ? 0.95 : isExpanded ? 1.05 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Step number badge */}
      {stepNumber && !isCenter && (
        <div className={cn(
          "absolute -top-3 -left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10",
          isFeedbackLoop ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
        )}>
          {stepNumber}
        </div>
      )}

      <div className={cn("p-5", isCenter && "p-6")}>
        <h4 className={cn(
          "font-bold text-foreground leading-tight",
          isCenter ? "text-lg" : "text-base"
        )}>
          {stage.label}
        </h4>
        <p className={cn(
          "text-muted-foreground mt-2 leading-relaxed",
          isCenter ? "text-sm" : "text-xs"
        )}>
          {stage.subtitle}
        </p>
        
        {/* Metrics indicator */}
        {hasMetrics && (
          <div className={cn(
            "mt-3 pt-3 border-t border-border/50 flex items-center gap-2",
            isExpanded && "border-primary/30"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isExpanded ? "bg-primary" : "bg-primary/60"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isExpanded ? "text-primary" : "text-primary/80"
            )}>
              {loop!.metrics.length} metric{loop!.metrics.length !== 1 ? 's' : ''}
            </span>
            <ChevronRight className={cn(
              "w-3 h-3 ml-auto transition-transform",
              isExpanded ? "text-primary rotate-90" : "text-muted-foreground"
            )} />
          </div>
        )}
        
        {!hasMetrics && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground/60">Click to explore</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
