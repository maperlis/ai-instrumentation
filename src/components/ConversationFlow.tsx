import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, Bot, ArrowLeft } from "lucide-react";
import { ConversationMessage, ApprovalType } from "@/types/orchestration";
import { Metric, TaxonomyEvent } from "@/types/taxonomy";

interface ConversationFlowProps {
  conversationHistory: ConversationMessage[];
  metrics: Metric[];
  events: TaxonomyEvent[];
  requiresApproval: boolean;
  approvalType: ApprovalType | null;
  isLoading: boolean;
  onApprove: (selectedMetrics?: string[]) => void;
  onReject: () => void;
  onBack: () => void;
  onComplete: (events: TaxonomyEvent[]) => void;
  status: string;
}

export function ConversationFlow({
  conversationHistory,
  metrics,
  events,
  requiresApproval,
  approvalType,
  isLoading,
  onApprove,
  onReject,
  onBack,
  onComplete,
  status,
}: ConversationFlowProps) {
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(
    metrics.map(m => m.id)
  );

  const toggleMetric = (metricId: string) => {
    setSelectedMetricIds(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleApprove = () => {
    if (approvalType === 'metrics') {
      onApprove(selectedMetricIds);
    } else if (approvalType === 'taxonomy') {
      onApprove();
    }
  };

  // Group metrics by category
  const groupedMetrics = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(metric);
    return acc;
  }, {} as Record<string, Metric[]>);

  // When completed, show the results
  if (status === 'completed' && events.length > 0) {
    onComplete(events);
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Start Over
      </Button>

      <Card className="p-6">
        {/* Conversation History */}
        <ScrollArea className="h-auto max-h-64 mb-6">
          <div className="space-y-4">
            {conversationHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.agent && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {msg.agent}
                    </Badge>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Processing...</span>
          </div>
        )}

        {/* Metrics Approval */}
        {!isLoading && requiresApproval && approvalType === 'metrics' && metrics.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Select Metrics to Track</h3>
            <p className="text-sm text-muted-foreground">
              Choose the metrics you want to measure. Your taxonomy will be optimized for these.
            </p>

            <div className="space-y-6">
              {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {categoryMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleMetric(metric.id)}
                      >
                        <Checkbox
                          checked={selectedMetricIds.includes(metric.id)}
                          onCheckedChange={() => toggleMetric(metric.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{metric.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {metric.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onReject}>
                <X className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleApprove}
                disabled={selectedMetricIds.length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Generate Taxonomy ({selectedMetricIds.length} metrics)
              </Button>
            </div>
          </div>
        )}

        {/* Taxonomy Approval */}
        {!isLoading && requiresApproval && approvalType === 'taxonomy' && events.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Generated Taxonomy</h3>
            <p className="text-sm text-muted-foreground">
              {events.length} events have been generated. Review and approve to finalize.
            </p>

            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-64">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Event Name</th>
                      <th className="text-left p-3 font-medium">Trigger</th>
                      <th className="text-left p-3 font-medium">Screen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-mono text-xs">{event.event_name}</td>
                        <td className="p-3">{event.trigger_action}</td>
                        <td className="p-3">{event.screen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onReject}>
                <X className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleApprove}>
                <Check className="w-4 h-4 mr-2" />
                Approve & Finalize
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
