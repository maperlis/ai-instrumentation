/**
 * Editable Metric Node Component
 * 
 * A React Flow custom node that wraps the existing MetricCard component
 * with connection handles for creating relationships between metrics.
 * 
 * Features:
 * - Connection handles (top/bottom) - always visible for easier connections
 * - Selection visual feedback
 * - Draggable container
 * - Expand/collapse children
 * - Click to select support
 */

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { MetricNode as MetricNodeType } from '@/types/metricsFramework';
import { MetricCard } from './MetricCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EditableMetricNodeData {
  metric: MetricNodeType;
  hasChildren?: boolean;
  onSelect?: (metric: MetricNodeType) => void;
  onToggleExpand?: (metricId: string) => void;
  onDelete?: (metricId: string) => void;
  isMultiSelected?: boolean;
  isConnectMode?: boolean;
}

/**
 * Custom node styles for connection handles.
 * Handles are small circles at the edges where connections can be made.
 */
const handleStyle = {
  width: 12,
  height: 12,
  background: 'hsl(var(--primary))',
  border: '2px solid hsl(var(--background))',
  cursor: 'crosshair',
};

const handleHiddenStyle = {
  ...handleStyle,
  opacity: 0.3,
};

export const EditableMetricNode = memo(function EditableMetricNode({
  data,
  selected,
  id,
}: NodeProps & { data: EditableMetricNodeData }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { metric, hasChildren, onSelect, onToggleExpand, onDelete, isMultiSelected, isConnectMode } = data;

  // Always show handles when hovered, selected, or in connect mode for easier connection
  const showHandles = isHovered || selected || isMultiSelected || isConnectMode;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(metric);
  }, [metric, onSelect]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(metric.id);
  }, [metric.id, onDelete]);

  return (
    <div 
      className={cn(
        "relative group cursor-pointer",
        // Visual feedback for selection
        (selected || isMultiSelected) && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Connection Handles - Top (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        style={showHandles ? handleStyle : handleHiddenStyle}
        className="transition-opacity duration-200 !cursor-crosshair"
        isConnectable={true}
      />
      
      {/* Connection Handles - Bottom (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={showHandles ? handleStyle : handleHiddenStyle}
        className="transition-opacity duration-200 !cursor-crosshair"
        isConnectable={true}
      />

      {/* Drag Indicator - shows on hover */}
      {isHovered && (
        <div className="absolute -left-7 top-1/2 -translate-y-1/2 p-1 rounded bg-muted/80 backdrop-blur-sm opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Delete button - shows on hover */}
      {isHovered && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md z-10"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}

      {/* Expand/Collapse Toggle for nodes with children */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
            onToggleExpand?.(metric.id);
          }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-card border shadow-sm hover:bg-muted transition-colors z-10"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      )}

      {/* The actual metric card */}
      <div className="min-w-[200px] max-w-[260px] pointer-events-none">
        <MetricCard
          metric={metric}
          isSelected={selected || isMultiSelected}
          onClick={() => {}}
          showInfluence
        />
      </div>
    </div>
  );
});

export default EditableMetricNode;
