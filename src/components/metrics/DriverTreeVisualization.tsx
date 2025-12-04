import { useCallback, useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { MetricNode as MetricNodeType, MetricRelationship, FrameworkData } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { cn } from "@/lib/utils";

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
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      )}
      <MetricCard
        metric={data.metric}
        isSelected={selected}
        onClick={() => data.onSelect?.(data.metric)}
        showInfluence
      />
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

    // Position nodes
    const levelHeight = 180;
    const nodeWidth = 200;
    
    Array.from(levelMap.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([level, metrics]) => {
        const totalWidth = metrics.length * (nodeWidth + 40);
        const startX = -totalWidth / 2;
        
        metrics.forEach((metric, index) => {
          // Check if this node should be hidden due to collapsed parent
          const parent = data.metrics.find(m => m.id === metric.parentId);
          const isHidden = metric.parentId && collapsedNodes.has(metric.parentId);
          
          if (!isHidden) {
            const hasChildren = data.metrics.some(m => m.parentId === metric.id);
            
            nodes.push({
              id: metric.id,
              type: 'metricNode',
              position: {
                x: startX + index * (nodeWidth + 40),
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
          label: rel.description,
          labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [data, collapsedNodes, selectedMetricId, onMetricSelect, toggleExpand]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative">
      {/* Empty State */}
      {!data.metrics.length && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No metrics yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Select a North Star metric and add contributing metrics to visualize your driver tree.
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
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          className="bg-background"
        >
          <Background color="hsl(var(--border))" gap={20} size={1} />
          <Controls 
            className="bg-card border rounded-lg shadow-md"
            showInteractive={false}
          />
        </ReactFlow>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Influence Strength</p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-primary rounded" />
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-secondary rounded" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-muted-foreground rounded" />
            <span>Weak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
