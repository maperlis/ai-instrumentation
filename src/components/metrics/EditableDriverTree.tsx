/**
 * Editable Driver Tree Visualization
 * 
 * An enhanced version of DriverTreeVisualization that supports:
 * - Dragging nodes to reposition them with tier-based snapping
 * - Drawing connections between metrics by dragging from handles
 * - Multi-select with Ctrl/Cmd+click
 * - Deleting nodes/edges with Delete/Backspace
 * - Panning (drag on empty space) and zooming (mouse wheel)
 * - Export/import of canvas state
 * - Tier zones: North Star → Core Drivers → Sub-Drivers
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
import { TierSnapZones, TierLevel, getTierFromY, getLevelFromTier, snapToTierY } from './TierSnapZones';
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
  onDataChange?: (data: FrameworkData) => void;
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
  onDataChange,
  selectedMetricId,
  storageKey,
}: EditableDriverTreeProps) {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<CanvasTool>('pointer');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPosition, setAddPosition] = useState({ x: 0, y: 0 });
  const [localMetrics, setLocalMetrics] = useState<MetricNodeType[]>(data.metrics);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTier, setActiveTier] = useState<TierLevel | null>(null);
  const [dragTargetNodeId, setDragTargetNodeId] = useState<string | null>(null);
  const { zoomIn, zoomOut, fitView, getNodes, screenToFlowPosition } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Canvas state management
  const canvasState = useCanvasState(storageKey || 'driver-tree-canvas');

  // Sync local metrics with data prop
  useEffect(() => {
    setLocalMetrics(data.metrics);
  }, [data.metrics]);

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

  // Handle adding a new metric to the canvas
  const handleAddMetric = useCallback((metricData: Partial<MetricNodeType>) => {
    const newMetric: MetricNodeType = {
      id: metricData.id || `metric-${Date.now()}`,
      name: metricData.name || 'New Metric',
      description: metricData.description || '',
      category: metricData.category || 'Driver',
      isNorthStar: metricData.isNorthStar || false,
      level: metricData.isNorthStar ? 0 : 1,
      calculation: metricData.calculation,
      businessQuestions: metricData.businessQuestions,
      status: 'healthy',
      trend: 'stable',
    };

    // Add to local metrics
    setLocalMetrics(prev => [...prev, newMetric]);
    
    // Store position for the new metric
    canvasState.updateNodePosition(newMetric.id, addPosition.x, addPosition.y);
    
    // Notify parent if callback provided
    onMetricAdd?.(newMetric);
    
    // Close dialog and reset tool
    setShowAddDialog(false);
    setActiveTool('pointer');
    
    toast.success(`Metric "${newMetric.name}" added to canvas`);
  }, [addPosition, canvasState, onMetricAdd]);

  // Handle deleting a metric
  const handleDeleteMetric = useCallback((metricId: string) => {
    setLocalMetrics(prev => prev.filter(m => m.id !== metricId));
    
    // Remove from canvas state
    canvasState.removeConnections(
      canvasState.state.connections
        .filter(c => c.sourceId === metricId || c.targetId === metricId)
        .map(c => c.id)
    );
    
    // Notify parent
    onMetricDelete?.(metricId);
    
    toast.success('Metric deleted');
  }, [canvasState, onMetricDelete]);

  // Build hierarchical tree and compute default positions
  const { computedNodes, dataEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!localMetrics.length) return { computedNodes: nodes, dataEdges: edges };

    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 120;
    const HORIZONTAL_GAP = 80;
    const VERTICAL_GAP = 160;

    const northStar = data.northStarMetric || localMetrics.find(m => m.isNorthStar);
    
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

    localMetrics.forEach(metric => {
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
      
      const metric = localMetrics.find(m => m.id === metricId);
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
      rootMetrics = localMetrics.filter(m => !parentMap.has(m.id));
      if (rootMetrics.length === 0) {
        rootMetrics = [localMetrics[0]];
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
            onDelete: handleDeleteMetric,
            isMultiSelected: canvasState.state.selectedNodeIds.includes(node.metric.id),
            isConnectMode: activeTool === 'connect',
            isDragTarget: dragTargetNodeId === node.metric.id,
          },
          selected: canvasState.state.selectedNodeIds.includes(node.metric.id),
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: activeTool === 'pointer',
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

    // Add orphan metrics (those not in the tree)
    const placedIds = new Set(nodes.map(n => n.id));
    const orphans = localMetrics.filter(m => !placedIds.has(m.id));
    
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
            onDelete: handleDeleteMetric,
            isMultiSelected: canvasState.state.selectedNodeIds.includes(metric.id),
            isConnectMode: activeTool === 'connect',
            isDragTarget: dragTargetNodeId === metric.id,
          },
          selected: canvasState.state.selectedNodeIds.includes(metric.id),
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: activeTool === 'pointer',
        });
        orphanX += NODE_WIDTH + HORIZONTAL_GAP;
      });
    }

    return { computedNodes: nodes, dataEdges: edges };
  }, [localMetrics, data.northStarMetric, data.relationships, collapsedNodes, onMetricSelect, toggleExpand, handleDeleteMetric, canvasState, activeTool, dragTargetNodeId]);

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

  // Handle connection creation - works in any mode now
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target && connection.source !== connection.target) {
      canvasState.addConnection(connection.source, connection.target);
      toast.success('Connection created');
    }
  }, [canvasState]);

  // Handle canvas click for adding metrics
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    // Clear selection on pane click and hide the definition panel
    canvasState.clearSelection();
    
    // Call onMetricSelect with undefined to hide the panel
    onMetricSelect?.(undefined as unknown as MetricNodeType);
    
    if (activeTool === 'add-node') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setAddPosition(position);
      setShowAddDialog(true);
    }
  }, [activeTool, screenToFlowPosition, canvasState, onMetricSelect]);

  // Handle node drag start
  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    setIsDragging(true);
    setDragTargetNodeId(null);
  }, []);

  // Handle node dragging - detect tier and nearby nodes for connection
  const onNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    const tier = getTierFromY(node.position.y);
    setActiveTier(tier);
    
    // Find nearby nodes in the tier above for drag-to-connect
    const currentNodes = getNodes();
    const draggedNodeTier = tier;
    
    // Determine which tier is "above" the current tier
    const tierAbove: TierLevel | null = 
      draggedNodeTier === 'sub-driver' ? 'driver' :
      draggedNodeTier === 'driver' ? 'north-star' : null;
    
    if (!tierAbove) {
      setDragTargetNodeId(null);
      return;
    }
    
    // Find closest node in the tier above within 150px horizontal distance
    let closestNode: Node | null = null;
    let closestDistance = Infinity;
    const HORIZONTAL_THRESHOLD = 150;
    
    currentNodes.forEach(n => {
      if (n.id === node.id) return;
      
      const nodeTier = getTierFromY(n.position.y);
      if (nodeTier !== tierAbove) return;
      
      const horizontalDistance = Math.abs(n.position.x - node.position.x);
      if (horizontalDistance < HORIZONTAL_THRESHOLD && horizontalDistance < closestDistance) {
        closestDistance = horizontalDistance;
        closestNode = n;
      }
    });
    
    setDragTargetNodeId(closestNode?.id || null);
  }, [getNodes]);

  // Handle node drag end - save positions, update tier/connections, and connect to target
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const targetNodeId = dragTargetNodeId;
    
    setIsDragging(false);
    setActiveTier(null);
    setDragTargetNodeId(null);
    
    const tier = getTierFromY(node.position.y);
    const newLevel = getLevelFromTier(tier);
    
    // Update metric level and connections based on new tier
    setLocalMetrics(prev => {
      const updatedMetrics = prev.map(m => {
        if (m.id === node.id) {
          const wasNorthStar = m.isNorthStar;
          const isNowNorthStar = tier === 'north-star';
          
          // If becoming North Star, make sure only one exists
          if (isNowNorthStar && !wasNorthStar) {
            toast.success(`"${m.name}" is now the North Star metric`);
          }
          
          return {
            ...m,
            level: newLevel,
            isNorthStar: isNowNorthStar,
            category: tier === 'north-star' ? 'North Star' : tier === 'driver' ? 'Driver' : 'Sub-Driver',
          };
        }
        // If another metric becomes North Star, demote this one
        if (tier === 'north-star' && m.isNorthStar && m.id !== node.id) {
          return { ...m, isNorthStar: false, level: 1, category: 'Driver' };
        }
        return m;
      });
      return updatedMetrics;
    });
    
    // Snap position to tier y-level (keep x, adjust y)
    const snappedY = snapToTierY(tier);
    const currentNodes = getNodes();
    
    // If we have a drag target, snap horizontally to align with it
    let finalX = node.position.x;
    if (targetNodeId) {
      const targetNode = currentNodes.find(n => n.id === targetNodeId);
      if (targetNode) {
        finalX = targetNode.position.x;
      }
    }
    
    const updatedNodes = currentNodes.map(n => {
      if (n.id === node.id) {
        return { ...n, position: { x: finalX, y: snappedY } };
      }
      return n;
    });
    canvasState.updatePositions(updatedNodes);
    
    // Connect to the specific target node if one was found during drag
    if (targetNodeId && targetNodeId !== node.id) {
      // Remove any existing connection from this node to other nodes in the tier above
      const existingConnections = canvasState.state.connections.filter(
        c => c.targetId === node.id
      );
      if (existingConnections.length > 0) {
        canvasState.removeConnections(existingConnections.map(c => c.id));
      }
      
      // Create connection from target (parent) to this node (child)
      canvasState.addConnection(targetNodeId, node.id);
      toast.success('Connected to metric');
      return;
    }
    
    // Auto-create connections based on tier if no specific target
    const northStarMetric = localMetrics.find(m => m.isNorthStar || m.level === 0);
    if (tier === 'driver' && northStarMetric && northStarMetric.id !== node.id) {
      // Connect driver to North Star if not already connected
      const existingConnection = canvasState.state.connections.find(
        c => (c.sourceId === northStarMetric.id && c.targetId === node.id) ||
             (c.sourceId === node.id && c.targetId === northStarMetric.id)
      );
      if (!existingConnection) {
        canvasState.addConnection(northStarMetric.id, node.id);
      }
    }
  }, [getNodes, canvasState, localMetrics, dragTargetNodeId]);

  // Handle selection changes - simplified to prevent race conditions
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
    // Update canvas state with selected node IDs
    const selectedNodeIds = selectedNodes.map(n => n.id);
    canvasState.setSelectedNodes(selectedNodeIds);
    
    // Call onMetricSelect if exactly one node is selected
    if (selectedNodes.length === 1 && onMetricSelect) {
      const metric = localMetrics.find(m => m.id === selectedNodes[0].id);
      if (metric) {
        onMetricSelect(metric);
      }
    }
    
    // Handle edge selection - only user-created edges
    const userSelectedEdgeIds = selectedEdges
      .filter(e => !e.id.startsWith('data-edge-'))
      .map(e => e.id);
    
    if (userSelectedEdgeIds.length > 0) {
      userSelectedEdgeIds.forEach(id => canvasState.selectEdge(id, true));
    }
  }, [canvasState, localMetrics, onMetricSelect]);

  // Handle edge click for selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (!edge.id.startsWith('data-edge-')) {
      canvasState.selectEdge(edge.id, false);
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
        handleDeleteSelected();
      }
      
      // Escape to clear selection or reset to pointer
      if (e.key === 'Escape') {
        canvasState.clearSelection();
        setActiveTool('pointer');
        setShowAddDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState]);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleFitView = useCallback(() => fitView({ padding: 0.4, duration: 200 }), [fitView]);

  const handleDeleteSelected = useCallback(() => {
    let deleted = false;
    
    // Delete selected edges first
    if (canvasState.state.selectedEdgeIds.length > 0) {
      canvasState.deleteSelectedEdges();
      deleted = true;
    }
    
    // Delete selected nodes
    if (canvasState.state.selectedNodeIds.length > 0) {
      canvasState.state.selectedNodeIds.forEach(nodeId => {
        handleDeleteMetric(nodeId);
      });
      canvasState.clearSelection();
      deleted = true;
    }
    
    if (deleted) {
      toast.success('Deleted successfully');
    }
  }, [canvasState, handleDeleteMetric]);

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

  const hasSelection = canvasState.state.selectedNodeIds.length > 0 || canvasState.state.selectedEdgeIds.length > 0;

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
        hasSelection={hasSelection}
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
        onAdd={handleAddMetric}
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
      {localMetrics.length === 0 && (
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
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed mb-4">
              Select a North Star metric and add contributing metrics to visualize your driver tree.
              Use the toolbar on the left to add metrics and draw connections.
            </p>
            <Button 
              onClick={() => {
                setActiveTool('add-node');
                setAddPosition({ x: 0, y: 0 });
                setShowAddDialog(true);
              }}
            >
              Add Your First Metric
            </Button>
          </motion.div>
        </div>
      )}

      {/* Tier Snap Zones - Visual guides when dragging */}
      <TierSnapZones activeTier={activeTier} isDragging={isDragging} />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag={false}
        selectionOnDrag={false}
        panOnDrag={activeTool === 'hand' ? true : activeTool === 'pointer' ? [1, 2] : false}
        selectionKeyCode={activeTool === 'pointer' ? 'Shift' : null}
        multiSelectionKeyCode={['Meta', 'Control']}
        deleteKeyCode={null}
        connectOnClick={activeTool === 'connect'}
        fitView
        fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        className={`bg-transparent ${activeTool === 'add-node' ? 'cursor-crosshair' : activeTool === 'hand' ? 'cursor-grab' : ''}`}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={24} size={1} />
      </ReactFlow>

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
