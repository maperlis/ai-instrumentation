/**
 * Canvas Side Toolbar Component (Figma-style)
 * 
 * A vertical toolbar on the left side of the canvas with tools for:
 * - Pointer (select/move)
 * - Hand (pan canvas)
 * - Add connection
 * - Add metric node
 * - Zoom controls
 */

import { 
  MousePointer2, 
  Hand, 
  Link2, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Trash2,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export type CanvasTool = 'pointer' | 'hand' | 'connect' | 'add-node';

interface CanvasSideToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
  className?: string;
}

const tools = [
  { id: 'pointer' as CanvasTool, icon: MousePointer2, label: 'Select & Move', shortcut: 'V' },
  { id: 'hand' as CanvasTool, icon: Hand, label: 'Pan Canvas', shortcut: 'H' },
  { id: 'connect' as CanvasTool, icon: Link2, label: 'Draw Connection', shortcut: 'C' },
  { id: 'add-node' as CanvasTool, icon: Square, label: 'Add Metric', shortcut: 'N' },
];

export function CanvasSideToolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  onDeleteSelected,
  hasSelection,
  className,
}: CanvasSideToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-40",
          "flex flex-col gap-1 p-1.5",
          "bg-card/95 backdrop-blur-sm border rounded-xl shadow-lg",
          className
        )}
      >
        {/* Tool Buttons */}
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg transition-all",
                  activeTool === tool.id 
                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                    : "hover:bg-muted"
                )}
                onClick={() => onToolChange(tool.id)}
              >
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{tool.label}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{tool.shortcut}</kbd>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator className="my-1" />

        {/* Delete Button - only shown when there's a selection */}
        {hasSelection && onDeleteSelected && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDeleteSelected}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>Delete</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Del</kbd>
              </TooltipContent>
            </Tooltip>
            <Separator className="my-1" />
          </>
        )}

        {/* Zoom Controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-muted"
              onClick={onZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-muted"
              onClick={onZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-muted"
              onClick={onFitView}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Fit to View</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
