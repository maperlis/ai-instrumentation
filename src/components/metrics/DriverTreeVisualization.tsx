import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { MetricNode as MetricNodeType, FrameworkData } from "@/types/metricsFramework";
import { MetricCard } from "./MetricCard";
import { ZoomControls } from "./ZoomControls";

interface DriverTreeVisualizationProps {
  data: FrameworkData;
  onMetricSelect?: (metric: MetricNodeType) => void;
  onMetricDrag?: (metricId: string, newParentId: string | null) => void;
  selectedMetricId?: string;
}

// Custom node component matching reference design
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
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 p-1 rounded-full bg-card border shadow-sm hover:bg-muted transition-colors z-10"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      )}
      <div className="min-w-[200px] max-w-[240px]">
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

interface TreeNode {
  metric: MetricNodeType;
  children: TreeNode[];
  x?: number;
  y?: number;
  width?: number;
}

function DriverTreeContent({
  data,
  onMetricSelect,
  onMetricDrag,
  selectedMetricId,
}: DriverTreeVisualizationProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const { zoomIn, zoomOut, fitView } = useReactFlow();

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

  // Build proper hierarchical tree structure
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!data.metrics.length) return { initialNodes: nodes, initialEdges: edges };

    const NODE_WIDTH = 240;
    const NODE_HEIGHT = 100;
    const HORIZONTAL_GAP = 80;
    const VERTICAL_GAP = 150;

    // Find North Star metric
    const northStar = data.northStarMetric || data.metrics.find(m => m.isNorthStar);
    
    // Build parent-child map from relationships
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    data.relationships.forEach(rel => {
      if (!childrenMap.has(rel.sourceId)) {
        childrenMap.set(rel.sourceId, []);
      }
      childrenMap.get(rel.sourceId)!.push(rel.targetId);
      parentMap.set(rel.targetId, rel.sourceId);
    });

    // Also use parentId from metrics if available
    data.metrics.forEach(metric => {
      if (metric.parentId) {
        if (!childrenMap.has(metric.parentId)) {
          childrenMap.set(metric.parentId, []);
        }
        if (!childrenMap.get(metric.parentId)!.includes(metric.id)) {
          childrenMap.get(metric.parentId)!.push(metric.id);
        }
        parentMap.set(metric.id, metric.parentId);
      }
    });

    // Build tree structure
    const buildTree = (metricId: string, visited: Set<string> = new Set()): TreeNode | null => {
      if (visited.has(metricId)) return null;
      visited.add(metricId);
      
      const metric = data.metrics.find(m => m.id === metricId);
      if (!metric) return null;

      const childIds = childrenMap.get(metricId) || [];
      const children: TreeNode[] = [];
      
      if (!collapsedNodes.has(metricId)) {
        childIds.forEach(childId => {
          const childNode = buildTree(childId, visited);
          if (childNode) children.push(childNode);
        });
      }

      return { metric, children };
    };

    // Find root nodes (nodes without parents or North Star)
    let rootMetrics: MetricNodeType[] = [];
    
    if (northStar) {
      rootMetrics = [northStar];
    } else {
      rootMetrics = data.metrics.filter(m => !parentMap.has(m.id));
      if (rootMetrics.length === 0) {
        rootMetrics = [data.metrics[0]];
      }
    }

    // Calculate subtree width recursively
    const calculateWidth = (node: TreeNode): number => {
      if (node.children.length === 0) {
        node.width = NODE_WIDTH;
        return NODE_WIDTH;
      }
      
      const childrenWidth = node.children.reduce((sum, child, i) => {
        const w = calculateWidth(child);
        return sum + w + (i > 0 ? HORIZONTAL_GAP : 0);
      }, 0);
      
      node.width = Math.max(NODE_WIDTH, childrenWidth);
      return node.width;
    };

    // Position nodes recursively
    const positionNodes = (node: TreeNode, x: number, y: number) => {
      node.x = x;
      node.y = y;
      
      if (node.children.length === 0) return;
      
      const totalChildWidth = node.children.reduce((sum, child, i) => {
        return sum + (child.width || NODE_WIDTH) + (i > 0 ? HORIZONTAL_GAP : 0);
      }, 0);
      
      let currentX = x - totalChildWidth / 2 + (node.children[0]?.width || NODE_WIDTH) / 2;
      
      node.children.forEach((child, i) => {
        if (i > 0) {
          currentX += (node.children[i - 1]?.width || NODE_WIDTH) / 2 + HORIZONTAL_GAP + (child.width || NODE_WIDTH) / 2;
        }
        positionNodes(child, currentX, y + VERTICAL_GAP + NODE_HEIGHT);
      });
    };

    // Convert tree to nodes and edges
    const flattenTree = (node: TreeNode) => {
      const hasChildren = node.children.length > 0;
      
      nodes.push({
        id: node.metric.id,
        type: 'metricNode',
        position: { x: (node.x || 0) - NODE_WIDTH / 2, y: node.y || 0 },
        data: {
          metric: node.metric,
          hasChildren,
          onSelect: onMetricSelect,
          onToggleExpand: toggleExpand,
        },
        selected: node.metric.id === selectedMetricId,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: true,
      });

      node.children.forEach(child => {
        edges.push({
          id: `edge-${node.metric.id}-${child.metric.id}`,
          source: node.metric.id,
          target: child.metric.id,
          type: 'smoothstep',
          style: {
            stroke: 'hsl(var(--primary))',
            strokeWidth: 2,
          },
        });
        
        flattenTree(child);
      });
    };

    // Build and position trees for all root metrics
    let offsetX = 0;
    rootMetrics.forEach((rootMetric, index) => {
      const tree = buildTree(rootMetric.id);
      if (tree) {
        calculateWidth(tree);
        positionNodes(tree, offsetX + (tree.width || NODE_WIDTH) / 2, 0);
        flattenTree(tree);
        offsetX += (tree.width || NODE_WIDTH) + HORIZONTAL_GAP * 2;
      }
    });

    // If there are orphan metrics (not connected), add them at the bottom
    const placedIds = new Set(nodes.map(n => n.id));
    const orphans = data.metrics.filter(m => !placedIds.has(m.id));
    
    if (orphans.length > 0) {
      const maxY = Math.max(...nodes.map(n => n.position.y), 0);
      const orphanY = maxY + VERTICAL_GAP + NODE_HEIGHT;
      const totalOrphanWidth = orphans.length * NODE_WIDTH + (orphans.length - 1) * HORIZONTAL_GAP;
      let orphanX = -totalOrphanWidth / 2;
      
      orphans.forEach(metric => {
        nodes.push({
          id: metric.id,
          type: 'metricNode',
          position: { x: orphanX, y: orphanY },
          data: {
            metric,
            hasChildren: false,
            onSelect: onMetricSelect,
            onToggleExpand: toggleExpand,
          },
          selected: metric.id === selectedMetricId,
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: true,
        });
        orphanX += NODE_WIDTH + HORIZONTAL_GAP;
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [data, collapsedNodes, selectedMetricId, onMetricSelect, toggleExpand]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleFitView = useCallback(() => fitView({ padding: 0.4, duration: 200 }), [fitView]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-background to-muted/20">
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleFitView}
      />

      {/* Empty State */}
      {!data.metrics.length && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
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
          fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
          minZoom={0.3}
          maxZoom={1.5}
          className="bg-transparent"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(var(--border))" gap={24} size={1} />
        </ReactFlow>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 border shadow-lg z-30">
        <p className="text-xs font-semibold mb-3 text-foreground">Tree Structure</p>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20 border-2 border-primary" />
            <span className="text-muted-foreground">North Star</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-card border" />
            <span className="text-muted-foreground">Driver Metric</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-muted-foreground">Influences</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriverTreeVisualization(props: DriverTreeVisualizationProps) {
  return (
    <ReactFlowProvider>
      <DriverTreeContent {...props} />
    </ReactFlowProvider>
  );
}
