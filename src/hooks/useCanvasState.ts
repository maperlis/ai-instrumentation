/**
 * Canvas State Management Hook
 * 
 * This hook manages the state for the editable metrics canvas including:
 * - Node positions (persisted separately from the data model)
 * - Connections between metrics (user-defined relationships)
 * - Selection state (multi-select support)
 * 
 * The state is stored locally and can be exported/imported as JSON.
 * To extend for new metric types: just ensure they have an 'id' field.
 */

import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';

export interface CanvasNodePosition {
  id: string;
  x: number;
  y: number;
}

export interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface CanvasState {
  positions: CanvasNodePosition[];
  connections: CanvasConnection[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}

const initialState: CanvasState = {
  positions: [],
  connections: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
};

export function useCanvasState(storageKey?: string) {
  const [state, setState] = useState<CanvasState>(() => {
    // Load from localStorage if key provided
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return initialState;
        }
      }
    }
    return initialState;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey]);

  // Update a single node's position
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setState(prev => {
      const existingIndex = prev.positions.findIndex(p => p.id === nodeId);
      const newPositions = [...prev.positions];
      
      if (existingIndex >= 0) {
        newPositions[existingIndex] = { id: nodeId, x, y };
      } else {
        newPositions.push({ id: nodeId, x, y });
      }
      
      return { ...prev, positions: newPositions };
    });
  }, []);

  // Batch update positions (for React Flow onNodesChange)
  const updatePositions = useCallback((nodes: Node[]) => {
    setState(prev => {
      const newPositions = nodes.map(node => ({
        id: node.id,
        x: node.position.x,
        y: node.position.y,
      }));
      return { ...prev, positions: newPositions };
    });
  }, []);

  // Add a connection between two metrics
  const addConnection = useCallback((sourceId: string, targetId: string, label?: string) => {
    setState(prev => {
      // Don't add duplicate connections
      const exists = prev.connections.some(
        c => c.sourceId === sourceId && c.targetId === targetId
      );
      if (exists) return prev;
      
      const newConnection: CanvasConnection = {
        id: `connection-${sourceId}-${targetId}-${Date.now()}`,
        sourceId,
        targetId,
        label,
      };
      
      return {
        ...prev,
        connections: [...prev.connections, newConnection],
      };
    });
  }, []);

  // Remove a connection
  const removeConnection = useCallback((connectionId: string) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId),
      selectedEdgeIds: prev.selectedEdgeIds.filter(id => id !== connectionId),
    }));
  }, []);

  // Remove multiple connections
  const removeConnections = useCallback((connectionIds: string[]) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => !connectionIds.includes(c.id)),
      selectedEdgeIds: prev.selectedEdgeIds.filter(id => !connectionIds.includes(id)),
    }));
  }, []);

  // Select a node (with multi-select support)
  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    setState(prev => {
      if (addToSelection) {
        const isAlreadySelected = prev.selectedNodeIds.includes(nodeId);
        return {
          ...prev,
          selectedNodeIds: isAlreadySelected
            ? prev.selectedNodeIds.filter(id => id !== nodeId)
            : [...prev.selectedNodeIds, nodeId],
        };
      }
      return {
        ...prev,
        selectedNodeIds: [nodeId],
        selectedEdgeIds: [],
      };
    });
  }, []);

  // Select an edge
  const selectEdge = useCallback((edgeId: string, addToSelection = false) => {
    setState(prev => {
      if (addToSelection) {
        const isAlreadySelected = prev.selectedEdgeIds.includes(edgeId);
        return {
          ...prev,
          selectedEdgeIds: isAlreadySelected
            ? prev.selectedEdgeIds.filter(id => id !== edgeId)
            : [...prev.selectedEdgeIds, edgeId],
        };
      }
      return {
        ...prev,
        selectedNodeIds: [],
        selectedEdgeIds: [edgeId],
      };
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    }));
  }, []);

  // Set multiple selected nodes
  const setSelectedNodes = useCallback((nodeIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedNodeIds: nodeIds,
    }));
  }, []);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback((onDeleteNode?: (nodeId: string) => void) => {
    state.selectedNodeIds.forEach(nodeId => {
      onDeleteNode?.(nodeId);
    });
    
    setState(prev => ({
      ...prev,
      // Remove positions for deleted nodes
      positions: prev.positions.filter(p => !prev.selectedNodeIds.includes(p.id)),
      // Remove connections involving deleted nodes
      connections: prev.connections.filter(
        c => !prev.selectedNodeIds.includes(c.sourceId) && !prev.selectedNodeIds.includes(c.targetId)
      ),
      selectedNodeIds: [],
    }));
  }, [state.selectedNodeIds]);

  // Delete selected edges
  const deleteSelectedEdges = useCallback(() => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => !prev.selectedEdgeIds.includes(c.id)),
      selectedEdgeIds: [],
    }));
  }, []);

  // Export canvas state as JSON
  const exportState = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  // Import canvas state from JSON
  const importState = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as CanvasState;
      setState(imported);
      return true;
    } catch {
      console.error('Failed to import canvas state');
      return false;
    }
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // Get position for a node (falls back to null if not set)
  const getNodePosition = useCallback((nodeId: string): { x: number; y: number } | null => {
    const pos = state.positions.find(p => p.id === nodeId);
    return pos ? { x: pos.x, y: pos.y } : null;
  }, [state.positions]);

  return {
    state,
    // Position management
    updateNodePosition,
    updatePositions,
    getNodePosition,
    // Connection management
    addConnection,
    removeConnection,
    removeConnections,
    // Selection management
    selectNode,
    selectEdge,
    clearSelection,
    setSelectedNodes,
    // Deletion
    deleteSelectedNodes,
    deleteSelectedEdges,
    // Import/Export
    exportState,
    importState,
    resetState,
  };
}
