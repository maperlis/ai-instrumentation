import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

export function ZoomControls({ onZoomIn, onZoomOut, onResetView, className = "" }: ZoomControlsProps) {
  // If className contains 'relative', render without absolute positioning
  const isRelative = className.includes('relative');
  
  return (
    <div className={`${isRelative ? '' : 'absolute top-4 right-4 z-40'} flex gap-1 bg-card/95 backdrop-blur-sm border rounded-lg p-1 shadow-sm ${className.replace('relative', '').replace('top-0', '').replace('right-0', '')}`}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn} title="Zoom In">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut} title="Zoom Out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetView} title="Fit View">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
