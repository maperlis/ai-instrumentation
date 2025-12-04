import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

export function ZoomControls({ onZoomIn, onZoomOut, onResetView, className = "" }: ZoomControlsProps) {
  return (
    <div className={`absolute top-4 right-4 z-40 flex gap-2 ${className}`}>
      <Button variant="outline" size="icon" onClick={onZoomIn} title="Zoom In">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onZoomOut} title="Zoom Out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onResetView} title="Fit View">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
