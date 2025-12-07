/**
 * Editable Driver Tree Visualization
 * 
 * An enhanced version of DriverTreeVisualization that supports:
 * - Dragging nodes to reposition them
 * - Drawing connections between metrics by dragging from handles
 * - Multi-select with Ctrl/Cmd+click
 * - Deleting nodes/edges with Delete/Backspace
 * - Panning (drag on empty space) and zooming (mouse wheel)
 * - Export/import of canvas state
 * 
 * Canvas logic location: This component + useCanvasState hook
 * Node positions: Stored in useCanvasState, merged with computed positions
 * Connections: User-defined connections stored separately from data relationships
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
  Connection,
  MarkerType,
  SelectionMode,
  OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { Sparkles, Download, Upload } from 'lucide-react';
import { MetricNode as MetricNodeType, FrameworkData } from '@/types/metricsFramework';
import { EditableMetricNode } from './EditableMetricNode';
import { CanvasSideToolbar, CanvasTool } from './CanvasSideToolbar';
import { AddMetricDialog } from './AddMetricDialog';
import { useCanvasState } from '@/hooks/useCanvasState';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditableDriverTreeProps {
  data: FrameworkData;
  onMetricSelect?: (metric: MetricNodeType) => void;
  onMetricDelete?: (metricId: string) => void;
  onMetricAdd?: (metric: Partial<MetricNodeType>) => void;
  selectedMetricId?: string;
  storageKey?: string;
}

// Register custom node type
const nodeTypes = {
  editableMetricNode: EditableMetricNode,
};

// Edge style for user-created connections
const userEdgeStyle = {
  stroke: 'hsl(var(--primary))',
  strokeWidth: 2,
};

// Edge style for data-driven relationships
const dataEdgeStyle = {
  stroke: 'hsl(var(--muted-foreground))',
  strokeWidth: 1.5,
  strokeDasharray: '5,5',
};

interface TreeNode {
  metric: MetricNodeType;
  children: TreeNode[];
  x?: number;
  y?: number;
  width?: number;
}

function EditableDriverTreeContent({
  data,
  onMetricSelect,
  onMetricDelete,
  onMetricAdd,
  selectedMetricId,
  storageKey,
}: EditableDriverTreeProps & { onMetricAdd?: (metric: Partial<MetricNodeType>) => void }) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<CanvasTool>('pointer');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPosition, setAddPosition] = useState({ x: 0, y: 0 });
  const { zoomIn, zoomOut, fitView, getNodes, screenToFlowPosition } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvas state management
  const canvasState = useCanvasState(storageKey || 'driver-tree-canvas');

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

  // Build hierarchical tree and compute default positions
  const { computedNodes, dataEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!data.metrics.length) return { computedNodes: nodes, dataEdges: edges };

    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 120;
    const HORIZONTAL_GAP = 80;
    const VERTICAL_GAP = 160;

    const northStar = data.northStarMetric || data.metrics.find(m => m.isNorthStar);
    
    // Build parent-child map
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    data.relationships.forEach(rel => {
      if (!childrenMap.has(rel.sourceId)) {
        childrenMap.set(rel.sourceId, []);
      }
      childrenMap.get(rel.sourceId)!.push(rel.targetId);
      parentMap.set(rel.targetId, rel.sourceId);
    });

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

    let rootMetrics: MetricNodeType[] = [];
    
    if (northStar) {
      rootMetrics = [northStar];
    } else {
      rootMetrics = data.metrics.filter(m => !parentMap.has(m.id));
      if (rootMetrics.length === 0) {
        rootMetrics = [data.metrics[0]];
      }
    }

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

    const flattenTree = (node: TreeNode) => {
      const hasChildren = node.children.length > 0;
      
      // Check if we have a saved position
      const savedPosition = canvasState.getNodePosition(node.metric.id);
      const position = savedPosition || { 
        x: (node.x || 0) - NODE_WIDTH / 2, 
        y: node.y || 0 
      };
      
      nodes.push({
        id: node.metric.id,
        type: 'editableMetricNode',
        position,
        data: {
          metric: node.metric,
          hasChildren,
          onSelect: onMetricSelect,
          onToggleExpand: toggleExpand,
          isMultiSelected: canvasState.state.selectedNodeIds.includes(node.metric.id),
        },
        selected: node.metric.id === selectedMetricId || canvasState.state.selectedNodeIds.includes(node.metric.id),
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: true,
      });

      node.children.forEach(child => {
        edges.push({
          id: `data-edge-${node.metric.id}-${child.metric.id}`,
          source: node.metric.id,
          target: child.metric.id,
          type: 'smoothstep',
          style: dataEdgeStyle,
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(var(--muted-foreground))',
            width: 15,
            height: 15,
          },
        });
        
        flattenTree(child);
      });
    };

    let offsetX = 0;
    rootMetrics.forEach((rootMetric) => {
      const tree = buildTree(rootMetric.id);
      if (tree) {
        calculateWidth(tree);
        positionNodes(tree, offsetX + (tree.width || NODE_WIDTH) / 2, 0);
        flattenTree(tree);
        offsetX += (tree.width || NODE_WIDTH) + HORIZONTAL_GAP * 2;
      }
    });

    // Add orphan metrics
    const placedIds = new Set(nodes.map(n => n.id));
    const orphans = data.metrics.filter(m => !placedIds.has(m.id));
    
    if (orphans.length > 0) {
      const maxY = Math.max(...nodes.map(n => n.position.y), 0);
      const orphanY = maxY + VERTICAL_GAP + NODE_HEIGHT;
      const totalOrphanWidth = orphans.length * NODE_WIDTH + (orphans.length - 1) * HORIZONTAL_GAP;
      let orphanX = -totalOrphanWidth / 2;
      
      orphans.forEach(metric => {
        const savedPosition = canvasState.getNodePosition(metric.id);
        const position = savedPosition || { x: orphanX, y: orphanY };
        
        nodes.push({
          id: metric.id,
          type: 'editableMetricNode',
          position,
          data: {
            metric,
            hasChildren: false,
            onSelect: onMetricSelect,
            onToggleExpand: toggleExpand,
            isMultiSelected: canvasState.state.selectedNodeIds.includes(metric.id),
          },
          selected: metric.id === selectedMetricId || canvasState.state.selectedNodeIds.includes(metric.id),
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: true,
        });
        orphanX += NODE_WIDTH + HORIZONTAL_GAP;
      });
    }

    return { computedNodes: nodes, dataEdges: edges };
  }, [data, collapsedNodes, selectedMetricId, onMetricSelect, toggleExpand, canvasState]);

  // Merge user-created connections with data edges
  const allEdges = useMemo(() => {
    const userEdges: Edge[] = canvasState.state.connections.map(conn => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: 'smoothstep',
      style: userEdgeStyle,
      animated: true,
      label: conn.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))',
        width: 20,
        height: 20,
      },
      selected: canvasState.state.selectedEdgeIds.includes(conn.id),
    }));
    
    return [...dataEdges, ...userEdges];
  }, [dataEdges, canvasState.state.connections, canvasState.state.selectedEdgeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);

  // Update nodes when computed changes
  useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  // Update edges when connections change
  useEffect(() => {
    setEdges(allEdges);
  }, [allEdges, setEdges]);

  // Handle connection creation
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      canvasState.addConnection(connection.source, connection.target);
      toast.success('Connection created');
    }
  }, [canvasState]);

  // Handle canvas click for adding metrics
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (activeTool === 'add-node') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setAddPosition(position);
      setShowAddDialog(true);
    }
  }, [activeTool, screenToFlowPosition]);

  // Handle node drag end - save positions
  const onNodeDragStop = useCallback(() => {
    const currentNodes = getNodes();
    canvasState.updatePositions(currentNodes);
  }, [getNodes, canvasState]);

  // Handle selection changes
  const onSelectionChange = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
    canvasState.setSelectedNodes(nodes.map(n => n.id));
    // Handle edge selection
    const selectedEdgeIds = edges
      .filter(e => e.selected)
      .map(e => e.id)
      .filter(id => !id.startsWith('data-edge-')); // Only select user edges
    
    if (selectedEdgeIds.length > 0) {
      selectedEdgeIds.forEach(id => canvasState.selectEdge(id, true));
    }
  }, [canvasState]);

  // Keyboard shortcuts for tools and deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is on an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setActiveTool('pointer');
      if (e.key === 'h' || e.key === 'H') setActiveTool('hand');
      if (e.key === 'c' || e.key === 'C') setActiveTool('connect');
      if (e.key === 'n' || e.key === 'N') setActiveTool('add-node');

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvasState.state.selectedEdgeIds.length > 0) {
          canvasState.deleteSelectedEdges();
          toast.success('Connection deleted');
        }
        if (canvasState.state.selectedNodeIds.length > 0 && onMetricDelete) {
          canvasState.deleteSelectedNodes(onMetricDelete);
          toast.success('Metric(s) deleted');
        }
      }
      
      // Escape to clear selection or reset to pointer
      if (e.key === 'Escape') {
        canvasState.clearSelection();
        setActiveTool('pointer');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState, onMetricDelete]);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleFitView = useCallback(() => fitView({ padding: 0.4, duration: 200 }), [fitView]);

  const handleDeleteSelected = useCallback(() => {
    if (canvasState.state.selectedEdgeIds.length > 0) {
      canvasState.deleteSelectedEdges();
      toast.success('Connection(s) deleted');
    }
    if (canvasState.state.selectedNodeIds.length > 0 && onMetricDelete) {
      canvasState.deleteSelectedNodes(onMetricDelete);
      toast.success('Metric(s) deleted');
    }
  }, [canvasState, onMetricDelete]);

  const handleExport = useCallback(() => {
    const json = canvasState.exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-state.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Canvas state exported');
  }, [canvasState]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (canvasState.importState(content)) {
        toast.success('Canvas state imported');
      } else {
        toast.error('Failed to import canvas state');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  }, [canvasState]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-background to-muted/20">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Figma-style Side Toolbar */}
      <CanvasSideToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={canvasState.state.selectedNodeIds.length > 0 || canvasState.state.selectedEdgeIds.length > 0}
      />

      {/* Top-right Export/Import Controls */}
      <TooltipProvider>
        <div className="absolute top-4 right-4 z-40 flex gap-1 bg-card/95 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export canvas state</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImport}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import canvas state</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Add Metric Dialog */}
      <AddMetricDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={(metric) => {
          onMetricAdd?.(metric);
          setActiveTool('pointer');
          toast.success('Metric added');
        }}
        position={addPosition}
      />

      {/* Tool Mode Indicator */}
      {activeTool !== 'pointer' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {activeTool === 'hand' && '🖐 Pan Mode - Click and drag to pan'}
          {activeTool === 'connect' && '🔗 Connect Mode - Drag from a handle to another node'}
          {activeTool === 'add-node' && '➕ Add Mode - Click anywhere to add a metric'}
        </div>
      )}

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
              Use the toolbar on the left to add metrics and draw connections.
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
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          selectionMode={SelectionMode.Partial}
          selectNodesOnDrag={activeTool === 'pointer'}
          selectionOnDrag={activeTool === 'pointer'}
          panOnDrag={activeTool === 'hand' ? true : [1, 2]}
          selectionKeyCode={activeTool === 'pointer' ? 'Shift' : null}
          multiSelectionKeyCode={['Meta', 'Control']}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          className={`bg-transparent ${activeTool === 'add-node' ? 'cursor-crosshair' : activeTool === 'hand' ? 'cursor-grab' : ''}`}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(var(--border))" gap={24} size={1} />
        </ReactFlow>
      )}

      {/* Legend - simplified since toolbar is prominent */}
      <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg z-30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary rounded-full" />
            <span>Custom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-muted-foreground border-dashed border-t-2 border-muted-foreground" />
            <span>Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditableDriverTree(props: EditableDriverTreeProps) {
  return (
    <ReactFlowProvider>
      <EditableDriverTreeContent {...props} />
    </ReactFlowProvider>
  );
}
