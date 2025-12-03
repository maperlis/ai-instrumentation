import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { Metric } from "@/types/taxonomy";

interface MetricSelectionPanelProps {
  metrics: Metric[];
  selectedMetricIds: string[];
  onToggleMetric: (metricId: string) => void;
  onApprove: () => void;
  isLoading: boolean;
  newMetricIds?: string[];
}

export function MetricSelectionPanel({
  metrics,
  selectedMetricIds,
  onToggleMetric,
  onApprove,
  isLoading,
  newMetricIds = [],
}: MetricSelectionPanelProps) {
  // Group metrics by category
  const groupedMetrics = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(metric);
    return acc;
  }, {} as Record<string, Metric[]>);

  const categoryOrder = ['Acquisition', 'Engagement', 'Retention', 'Monetization', 'Product Usage', 'Other'];
  const sortedCategories = Object.keys(groupedMetrics).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">Select Metrics to Track</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the metrics you want to measure. Your taxonomy will be optimized for these.
        </p>
      </div>

      {/* Metrics List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                {category}
                <Badge variant="secondary" className="text-xs">
                  {groupedMetrics[category].length}
                </Badge>
              </h4>
              <div className="space-y-2">
                {groupedMetrics[category].map((metric) => {
                  const isNew = newMetricIds.includes(metric.id);
                  return (
                    <div
                      key={metric.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedMetricIds.includes(metric.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      } ${isNew ? 'ring-2 ring-amber-500/50 animate-pulse' : ''}`}
                      onClick={() => onToggleMetric(metric.id)}
                    >
                      <Checkbox
                        checked={selectedMetricIds.includes(metric.id)}
                        onCheckedChange={() => onToggleMetric(metric.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{metric.name}</p>
                          {isNew && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                              <Sparkles className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {metric.description}
                        </p>
                        {metric.example_events && metric.example_events.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {metric.example_events.slice(0, 3).map((event, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-mono">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <Button
          onClick={onApprove}
          disabled={selectedMetricIds.length === 0 || isLoading}
          className="w-full"
          size="lg"
        >
          <Check className="w-4 h-4 mr-2" />
          Generate Taxonomy ({selectedMetricIds.length} metrics selected)
        </Button>
      </div>
    </div>
  );
}
