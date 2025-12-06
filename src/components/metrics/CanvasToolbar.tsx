/**
 * Canvas Toolbar Component
 * 
 * Provides controls for the editable canvas:
 * - Zoom controls (in/out/reset)
 * - Selection info
 * - Delete action
 * - Export/Import canvas state
 */

import { Trash2, Download, Upload, MousePointer2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZoomControls } from './ZoomControls';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  onDeleteSelected: () => void;
  onExport: () => void;
  onImport: () => void;
  isConnecting?: boolean;
  className?: string;
}

export function CanvasToolbar({
  onZoomIn,
  onZoomOut,
  onResetView,
  selectedNodeCount,
  selectedEdgeCount,
  onDeleteSelected,
  onExport,
  onImport,
  isConnecting,
  className,
}: CanvasToolbarProps) {
  const hasSelection = selectedNodeCount > 0 || selectedEdgeCount > 0;

  return (
    <div className={cn("absolute top-4 right-4 z-40 flex items-center gap-2", className)}>
      {/* Connection mode indicator */}
      {isConnecting && (
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
          <Link2 className="w-3.5 h-3.5" />
          Drawing connection...
        </Badge>
      )}

      {/* Selection info */}
      {hasSelection && (
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border rounded-lg px-3 py-1.5 shadow-sm">
          <MousePointer2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {selectedNodeCount > 0 && `${selectedNodeCount} node${selectedNodeCount > 1 ? 's' : ''}`}
            {selectedNodeCount > 0 && selectedEdgeCount > 0 && ', '}
            {selectedEdgeCount > 0 && `${selectedEdgeCount} edge${selectedEdgeCount > 1 ? 's' : ''}`}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onDeleteSelected}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected (Del/Backspace)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Export/Import */}
      <div className="flex gap-1 bg-card/95 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export canvas state</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onImport}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import canvas state</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetView={onResetView}
        className="relative top-0 right-0"
      />
    </div>
  );
}
