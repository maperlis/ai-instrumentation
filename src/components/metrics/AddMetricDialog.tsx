/**
 * Add Metric Dialog
 * 
 * A dialog for adding a new metric node to the canvas.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricNode } from '@/types/metricsFramework';

interface AddMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (metric: Partial<MetricNode>) => void;
  position?: { x: number; y: number };
}

export function AddMetricDialog({
  open,
  onOpenChange,
  onAdd,
  position,
}: AddMetricDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'northStar' | 'driver' | 'subDriver'>('driver');
  const [calculation, setCalculation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const newMetric: Partial<MetricNode> = {
      id: `metric-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || '',
      category: type === 'northStar' ? 'North Star' : type === 'driver' ? 'Driver' : 'Sub-Driver',
      calculation: calculation.trim() || undefined,
      isNorthStar: type === 'northStar',
    };

    onAdd(newMetric);
    
    // Reset form
    setName('');
    setDescription('');
    setType('driver');
    setCalculation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Metric Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Active Users"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Metric Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="northStar">North Star</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="subDriver">Sub-Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this metric..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calculation">Calculation Formula</Label>
            <Input
              id="calculation"
              value={calculation}
              onChange={(e) => setCalculation(e.target.value)}
              placeholder="e.g., Total Revenue / Total Users"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add Metric
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
