import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { MetricNode as MetricNodeType, MetricRelationship, FrameworkData } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";

interface DriverTreeVisualizationProps {
  data: FrameworkData;
  onMetricSelect?: (metric: MetricNodeType) => void;
  onMetricDrag?: (metricId: string, newParentId: string | null) => void;
  selectedMetricId?: string;
}

// Custom node component
const TreeMetricNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = data.hasChildren;

  return (
    <div className="relative">
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
            data.onToggleExpand?.(data.metric.id);
          }}
          className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card border shadow-sm hover:bg-muted transition-colors z-10"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      )}
      <div className="min-w-[220px] max-w-[280px]">
        <MetricCard
          metric={data.metric}
          isSelected={selected}
          onClick={() => data.onSelect?.(data.metric)}
          showInfluence
        />
      </div>
    </div>
  );
};

const nodeTypes = {
  metricNode: TreeMetricNode,
};

export function DriverTreeVisualization({
  data,
  onMetricSelect,
  onMetricDrag,
  selectedMetricId,
}: DriverTreeVisualizationProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Build hierarchical structure
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!data.metrics.length) return { initialNodes: nodes, initialEdges: edges };

    // Group metrics by level
    const northStar = data.northStarMetric || data.metrics.find(m => m.isNorthStar);
    const levelMap = new Map<number, MetricNodeType[]>();
    
    data.metrics.forEach(metric => {
      const level = metric.level ?? (metric.isNorthStar ? 0 : 1);
      if (!levelMap.has(level)) levelMap.set(level, []);
      levelMap.get(level)!.push(metric);
    });

    // Position nodes with better spacing
    const levelHeight = 220;
    const nodeWidth = 280;
    const nodeGap = 60;
    
    Array.from(levelMap.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([level, metrics]) => {
        const totalWidth = metrics.length * nodeWidth + (metrics.length - 1) * nodeGap;
        const startX = -totalWidth / 2;
        
        metrics.forEach((metric, index) => {
          // Check if this node should be hidden due to collapsed parent
          const isHidden = metric.parentId && collapsedNodes.has(metric.parentId);
          
          if (!isHidden) {
            const hasChildren = data.metrics.some(m => m.parentId === metric.id);
            
            nodes.push({
              id: metric.id,
              type: 'metricNode',
              position: {
                x: startX + index * (nodeWidth + nodeGap),
                y: level * levelHeight,
              },
              data: {
                metric,
                hasChildren,
                onSelect: onMetricSelect,
                onToggleExpand: toggleExpand,
              },
              selected: metric.id === selectedMetricId,
              sourcePosition: Position.Bottom,
              targetPosition: Position.Top,
              draggable: true,
            });
          }
        });
      });

    // Create edges
    data.relationships.forEach((rel, index) => {
      const sourceHidden = collapsedNodes.has(rel.sourceId);
      const targetNode = nodes.find(n => n.id === rel.targetId);
      
      if (!sourceHidden && targetNode) {
        const strengthColors = {
          strong: 'hsl(var(--primary))',
          medium: 'hsl(var(--secondary))',
          weak: 'hsl(var(--muted-foreground))',
        };
        const strengthWidth = {
          strong: 3,
          medium: 2,
          weak: 1,
        };

        edges.push({
          id: `edge-${index}`,
          source: rel.sourceId,
          target: rel.targetId,
          type: 'smoothstep',
          animated: rel.influenceStrength === 'strong',
          style: {
            stroke: strengthColors[rel.influenceStrength || 'medium'],
            strokeWidth: strengthWidth[rel.influenceStrength || 'medium'],
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strengthColors[rel.influenceStrength || 'medium'],
          },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [data, collapsedNodes, selectedMetricId, onMetricSelect, toggleExpand]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-background to-muted/20">
      {/* Empty State */}
      {!data.metrics.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No metrics selected yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Select a North Star metric and add contributing metrics to visualize your driver tree.
              The tree will show how each metric influences your goals.
            </p>
          </motion.div>
        </div>
      )}

      {/* React Flow Canvas */}
      {data.metrics.length > 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.2}
          className="bg-transparent"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(var(--border))" gap={24} size={1} />
          <Controls 
            className="bg-card border rounded-lg shadow-md [&>button]:border-border"
            showInteractive={false}
          />
        </ReactFlow>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 border shadow-lg">
        <p className="text-xs font-semibold mb-3 text-foreground">Influence Strength</p>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-muted-foreground">Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-secondary rounded-full" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-muted-foreground/50 rounded-full" />
            <span className="text-muted-foreground">Weak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
