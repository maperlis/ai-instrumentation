import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, ArrowRight } from "lucide-react";
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
  },
  {
    id: "integrations",
    label: "Integrations",
    subtitle: "Are we bringing in the right data, and enough of it, to give the AI meaningful context?",
    position: "right",
    angle: -30,
  },
  {
    id: "ai-model",
    label: "AI Model",
    subtitle: "Did the AI produce an output that was correct, complete, and required minimal manual correction?",
    position: "center",
    angle: 0,
  },
  {
    id: "more-consumption",
    label: "More Consumption",
    subtitle: "Where does AI replace manual work enough that users start to rely on it daily?",
    position: "bottom",
    angle: 90,
  },
  {
    id: "higher-activation",
    label: "Higher Activation",
    subtitle: "Which AI use cases create the strongest habit loops inside the product?",
    position: "left",
    angle: 210,
  },
];

const howItWorksSteps = [
  "User actions and integrations feed the system with the context needed to understand work.",
  "Better context makes AI outputs more accurate and useful.",
  "More accurate AI drives higher activation and consumption across tasks, docs, and workflows.",
  "Increased usage generates richer data, which makes the AI even better and accelerates customer productivity.",
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

  // Map loops to stages for data binding
  const getLoopForStage = (stageId: string) => {
    return loops.find(l => l.id === stageId || l.name.toLowerCase().includes(stageId.split('-').join(' ')));
  };

  const selectedStageData = expandedStage ? loops.find(l => l.id === expandedStage) : null;

  // Stage positions on the flywheel
  const getStagePosition = (index: number) => {
    const positions = [
      { x: 0, y: -180 },      // Richer AI Context (top)
      { x: 200, y: -60 },     // Integrations (right-top)
      { x: 0, y: 60 },        // AI Model (center-bottom)
      { x: 0, y: 200 },       // More Consumption (bottom)
      { x: -200, y: -60 },    // Higher Activation (left-top)
    ];
    return positions[index] || { x: 0, y: 0 };
  };

  // Connection path between stages
  const getConnectionPath = (fromIndex: number, toIndex: number) => {
    const from = getStagePosition(fromIndex);
    const to = getStagePosition(toIndex);
    return `M ${from.x + 350} ${from.y + 280} Q ${(from.x + to.x) / 2 + 350 + 50} ${(from.y + to.y) / 2 + 280} ${to.x + 350} ${to.y + 280}`;
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Title */}
      <div className="absolute top-6 left-6 z-20">
        <h2 className="text-2xl font-bold text-foreground">AI Growth Flywheel Framework</h2>
      </div>

      {/* Zoomable/Pannable Container */}
      <div 
        className="w-full h-full flex items-start justify-center pt-16"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <div className="relative flex gap-8">
          {/* How It Works Section */}
          <div className="w-64 pt-32 shrink-0">
            <h3 className="text-lg font-semibold mb-4 text-foreground">How it Works</h3>
            <div className="space-y-4">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold",
                    index < 3 ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Flywheel Visualization */}
          <div className="relative w-[700px] h-[560px]">
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {/* Curved arrows between stages */}
              {/* Top arc: Richer AI Context to Integrations */}
              <path
                d="M 350 100 Q 500 50 550 220"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                strokeDasharray="0"
                opacity={0.3}
              />
              {/* Right arc: Integrations to AI Model */}
              <path
                d="M 500 260 Q 450 320 350 340"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                opacity={0.3}
              />
              {/* Bottom arc: AI Model to More Consumption */}
              <path
                d="M 350 380 Q 350 430 350 450"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity={0.3}
              />
              {/* Left arc: Higher Activation to Richer AI Context */}
              <path
                d="M 150 220 Q 100 50 350 100"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                opacity={0.3}
              />
              {/* More Consumption to Higher Activation (dashed) */}
              <path
                d="M 280 480 Q 100 400 150 260"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity={0.3}
              />

              {/* Number markers on arrows */}
              <circle cx="450" cy="70" r="14" fill="hsl(var(--primary))" />
              <text x="450" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">1</text>
              
              <circle cx="550" cy="180" r="14" fill="hsl(var(--primary))" />
              <text x="550" y="185" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">1</text>
              
              <circle cx="420" cy="310" r="14" fill="hsl(var(--primary))" />
              <text x="420" y="315" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">2</text>
              
              <circle cx="350" cy="420" r="14" fill="hsl(var(--primary))" />
              <text x="350" y="425" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">3</text>
              
              <circle cx="200" cy="470" r="14" fill="hsl(var(--emerald-500, 16 185 129))" className="fill-emerald-500" />
              <text x="200" y="475" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">4</text>
            </svg>

            {/* Stage: Richer AI Context (Top) */}
            <motion.div
              className="absolute"
              style={{ left: '50%', top: '20px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StageNode
                stage={flywheelStages[0]}
                loop={getLoopForStage('richer-ai-context') || loops[0]}
                isExpanded={expandedStage === flywheelStages[0].id}
                isSelected={selectedLoopId === flywheelStages[0].id}
                onClick={(loop) => {
                  setExpandedStage(expandedStage === flywheelStages[0].id ? null : flywheelStages[0].id);
                  if (loop) onLoopSelect?.(loop);
                }}
              />
            </motion.div>

            {/* Stage: Integrations (Right) */}
            <motion.div
              className="absolute"
              style={{ right: '0', top: '180px' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StageNode
                stage={flywheelStages[1]}
                loop={getLoopForStage('integrations') || loops[1]}
                isExpanded={expandedStage === flywheelStages[1].id}
                isSelected={selectedLoopId === flywheelStages[1].id}
                onClick={(loop) => {
                  setExpandedStage(expandedStage === flywheelStages[1].id ? null : flywheelStages[1].id);
                  if (loop) onLoopSelect?.(loop);
                }}
              />
            </motion.div>

            {/* Stage: AI Model (Center) */}
            <motion.div
              className="absolute"
              style={{ left: '50%', top: '280px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StageNode
                stage={flywheelStages[2]}
                loop={getLoopForStage('ai-model') || loops[2]}
                isExpanded={expandedStage === flywheelStages[2].id}
                isSelected={selectedLoopId === flywheelStages[2].id}
                isCenter
                onClick={(loop) => {
                  setExpandedStage(expandedStage === flywheelStages[2].id ? null : flywheelStages[2].id);
                  if (loop) onLoopSelect?.(loop);
                }}
              />
            </motion.div>

            {/* Stage: More Consumption (Bottom) */}
            <motion.div
              className="absolute"
              style={{ left: '50%', bottom: '20px', transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StageNode
                stage={flywheelStages[3]}
                loop={getLoopForStage('more-consumption') || loops[3]}
                isExpanded={expandedStage === flywheelStages[3].id}
                isSelected={selectedLoopId === flywheelStages[3].id}
                onClick={(loop) => {
                  setExpandedStage(expandedStage === flywheelStages[3].id ? null : flywheelStages[3].id);
                  if (loop) onLoopSelect?.(loop);
                }}
              />
            </motion.div>

            {/* Stage: Higher Activation (Left) */}
            <motion.div
              className="absolute"
              style={{ left: '0', top: '180px' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <StageNode
                stage={flywheelStages[4]}
                loop={getLoopForStage('higher-activation') || loops[4]}
                isExpanded={expandedStage === flywheelStages[4].id}
                isSelected={selectedLoopId === flywheelStages[4].id}
                onClick={(loop) => {
                  setExpandedStage(expandedStage === flywheelStages[4].id ? null : flywheelStages[4].id);
                  if (loop) onLoopSelect?.(loop);
                }}
              />
            </motion.div>
          </div>

          {/* North Star Section (Right) */}
          <div className="w-64 pt-72 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {/* Dotted line from More Consumption to North Star */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
              </div>

              <div className="flex items-center gap-2 text-amber-500">
                <Star className="w-6 h-6 fill-amber-400" />
                <span className="text-lg font-bold text-foreground">North Star</span>
              </div>

              {/* Customer ROI Box */}
              <div 
                className="border-2 border-primary rounded-lg p-4 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => northStarMetric && onMetricSelect?.(northStarMetric)}
              >
                {northStarMetric ? (
                  <div>
                    <h4 className="font-semibold text-foreground">{northStarMetric.name}</h4>
                    {northStarMetric.currentValue && (
                      <p className="text-sm text-muted-foreground mt-1">{northStarMetric.currentValue}</p>
                    )}
                  </div>
                ) : (
                  <h4 className="font-semibold text-foreground">Customer ROI</h4>
                )}
              </div>

              {/* Retention & Expansion Box */}
              <div className="border-2 border-emerald-500 rounded-lg p-4 bg-emerald-500/5">
                <h4 className="font-semibold text-foreground">Retention & Expansion</h4>
                <p className="text-sm text-muted-foreground mt-1">(AI Credit Spend + Seat Expansion)</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Side Panel for expanded stage metrics */}
      <AnimatePresence>
        {expandedStage && selectedStageData && selectedStageData.metrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-20 bottom-4 w-80 z-30 overflow-hidden"
          >
            <div className="bg-card border-2 rounded-xl shadow-xl h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedStageData.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{selectedStageData.momentum} momentum</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setExpandedStage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground px-4 pt-3 pb-2 leading-relaxed">
                {selectedStageData.description}
              </p>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {selectedStageData.metrics.map(metric => (
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
    </div>
  );
}

// Stage Node Component
interface StageNodeProps {
  stage: typeof flywheelStages[0];
  loop?: FlywheelLoop;
  isExpanded: boolean;
  isSelected: boolean;
  isCenter?: boolean;
  onClick: (loop?: FlywheelLoop) => void;
}

function StageNode({ stage, loop, isExpanded, isSelected, isCenter, onClick }: StageNodeProps) {
  return (
    <motion.div
      className={cn(
        "bg-card border rounded-lg p-4 cursor-pointer transition-all max-w-[200px]",
        isCenter ? "border-2 border-muted-foreground/30 shadow-lg" : "border-border",
        (isExpanded || isSelected) && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick(loop);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <h4 className={cn(
        "font-semibold text-foreground",
        isCenter ? "text-base" : "text-sm"
      )}>
        {stage.label}
      </h4>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {stage.subtitle}
      </p>
      {loop && loop.metrics.length > 0 && (
        <p className="text-xs text-primary mt-2 font-medium">
          {loop.metrics.length} metrics
        </p>
      )}
    </motion.div>
  );
}
