/**
 * Tier Snap Zones Component
 * 
 * Renders visual tier guides for the driver tree canvas:
 * - North Star tier (top)
 * - Core Driver tier (middle)
 * - Sub-Driver tier (bottom)
 * 
 * Shows active zone highlighting when a node is being dragged.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type TierLevel = 'north-star' | 'driver' | 'sub-driver';

export interface TierZone {
  id: TierLevel;
  label: string;
  yStart: number;
  yEnd: number;
}

// Tier zone boundaries (y-coordinates in the canvas)
export const TIER_ZONES: TierZone[] = [
  { id: 'north-star', label: 'North Star', yStart: -Infinity, yEnd: 150 },
  { id: 'driver', label: 'Core Drivers', yStart: 150, yEnd: 400 },
  { id: 'sub-driver', label: 'Sub-Drivers', yStart: 400, yEnd: Infinity },
];

// Get tier from y position
export function getTierFromY(y: number): TierLevel {
  if (y < 150) return 'north-star';
  if (y < 400) return 'driver';
  return 'sub-driver';
}

// Get numeric level from tier
export function getLevelFromTier(tier: TierLevel): number {
  switch (tier) {
    case 'north-star': return 0;
    case 'driver': return 1;
    case 'sub-driver': return 2;
  }
}

// Get tier from numeric level
export function getTierFromLevel(level: number | undefined): TierLevel {
  if (level === 0) return 'north-star';
  if (level === 1) return 'driver';
  return 'sub-driver';
}

// Snap y position to tier center
export function snapToTierY(tier: TierLevel): number {
  switch (tier) {
    case 'north-star': return 0;
    case 'driver': return 280;
    case 'sub-driver': return 560;
  }
}

interface TierSnapZonesProps {
  activeTier?: TierLevel | null;
  isDragging?: boolean;
  viewportTransform?: { x: number; y: number; zoom: number };
}

export const TierSnapZones = memo(function TierSnapZones({
  activeTier,
  isDragging,
}: TierSnapZonesProps) {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* North Star Zone */}
      <div
        className={cn(
          "absolute left-0 right-0 border-b-2 border-dashed transition-all duration-200",
          activeTier === 'north-star' 
            ? "bg-amber-500/10 border-amber-500/50" 
            : "bg-transparent border-border/30"
        )}
        style={{ top: 0, height: '150px' }}
      >
        <div className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
          activeTier === 'north-star' 
            ? "bg-amber-500/20 text-amber-600 border border-amber-500/30" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          ⭐ North Star
        </div>
      </div>

      {/* Core Driver Zone */}
      <div
        className={cn(
          "absolute left-0 right-0 border-b-2 border-dashed transition-all duration-200",
          activeTier === 'driver' 
            ? "bg-primary/10 border-primary/50" 
            : "bg-transparent border-border/30"
        )}
        style={{ top: '150px', height: '250px' }}
      >
        <div className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
          activeTier === 'driver' 
            ? "bg-primary/20 text-primary border border-primary/30" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          📊 Core Drivers
        </div>
      </div>

      {/* Sub-Driver Zone */}
      <div
        className={cn(
          "absolute left-0 right-0 transition-all duration-200",
          activeTier === 'sub-driver' 
            ? "bg-secondary/20 border-t-2 border-dashed border-secondary/50" 
            : "bg-transparent"
        )}
        style={{ top: '400px', bottom: 0 }}
      >
        <div className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
          activeTier === 'sub-driver' 
            ? "bg-secondary/30 text-secondary-foreground border border-secondary/30" 
            : "bg-muted/50 text-muted-foreground"
        )}>
          📈 Sub-Drivers
        </div>
      </div>
    </div>
  );
});
