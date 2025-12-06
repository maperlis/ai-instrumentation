/**
 * Editable Metric Node Component
 * 
 * A React Flow custom node that wraps the existing MetricCard component
 * with connection handles for creating relationships between metrics.
 * 
 * Features:
 * - Connection handles (top/bottom/left/right)
 * - Selection visual feedback
 * - Draggable container
 * - Expand/collapse children
 */

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { MetricNode as MetricNodeType } from '@/types/metricsFramework';
import { MetricCard } from './MetricCard';
import { cn } from '@/lib/utils';

interface EditableMetricNodeData {
  metric: MetricNodeType;
  hasChildren?: boolean;
  onSelect?: (metric: MetricNodeType) => void;
  onToggleExpand?: (metricId: string) => void;
  isMultiSelected?: boolean;
}

/**
 * Custom node styles for connection handles.
 * Handles are small circles at the edges where connections can be made.
 */
const handleStyle = {
  width: 10,
  height: 10,
  background: 'hsl(var(--primary))',
  border: '2px solid hsl(var(--background))',
};

const hiddenHandleStyle = {
  ...handleStyle,
  opacity: 0,
  pointerEvents: 'all' as const,
};

export const EditableMetricNode = memo(function EditableMetricNode({
  data,
  selected,
}: NodeProps & { data: EditableMetricNodeData }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { metric, hasChildren, onSelect, onToggleExpand, isMultiSelected } = data;

  const showHandles = isHovered || selected || isMultiSelected;

  return (
    <div 
      className={cn(
        "relative group",
        // Visual feedback for selection
        (selected || isMultiSelected) && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles - shown on hover/select */}
      <Handle
        type="target"
        position={Position.Top}
        style={showHandles ? handleStyle : hiddenHandleStyle}
        className="transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={showHandles ? handleStyle : hiddenHandleStyle}
        className="transition-opacity duration-200"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={showHandles ? handleStyle : hiddenHandleStyle}
        className="transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={showHandles ? handleStyle : hiddenHandleStyle}
        className="transition-opacity duration-200"
      />

      {/* Drag Indicator - shows on hover */}
      {isHovered && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 rounded bg-muted/80 backdrop-blur-sm opacity-60 hover:opacity-100 cursor-grab">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
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
      <div className="min-w-[200px] max-w-[260px]">
        <MetricCard
          metric={metric}
          isSelected={selected || isMultiSelected}
          onClick={() => onSelect?.(metric)}
          showInfluence
        />
      </div>
    </div>
  );
});

export default EditableMetricNode;
