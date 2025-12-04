import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, Bot, Check, X } from "lucide-react";
import { ConversationMessage, ApprovalType } from "@/types/orchestration";
import { Metric, TaxonomyEvent } from "@/types/taxonomy";
import { FrameworkRecommendation, ClarifyingQuestion } from "@/types/metricsFramework";
import { AgentChat } from "./AgentChat";
import { MetricSelectionPanel } from "./MetricSelectionPanel";
import { MetricsFrameworkView } from "./metrics";

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
  onSendMessage: (message: string) => void;
  status: string;
  newMetricIds?: string[];
  frameworkRecommendation?: FrameworkRecommendation | null;
  clarifyingQuestions?: ClarifyingQuestion[];
  onClarifyingAnswer?: (answers: Record<string, string>) => void;
  useFrameworkView?: boolean;
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
  onSendMessage,
  status,
  newMetricIds = [],
  frameworkRecommendation,
  clarifyingQuestions = [],
  onClarifyingAnswer,
  useFrameworkView = true,
}: ConversationFlowProps) {
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>([]);

  // Initialize selected metrics when metrics change
  useEffect(() => {
    if (metrics.length > 0 && selectedMetricIds.length === 0) {
      setSelectedMetricIds(metrics.map(m => m.id));
    }
  }, [metrics]);

  // Add new metrics to selection automatically
  useEffect(() => {
    if (newMetricIds.length > 0) {
      setSelectedMetricIds(prev => {
        const newIds = newMetricIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [newMetricIds]);

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

  // When completed, show the results
  if (status === 'completed' && events.length > 0) {
    onComplete(events);
    return null;
  }

  // Metrics approval with framework visualization
  if (requiresApproval && approvalType === 'metrics' && metrics.length > 0) {
    if (useFrameworkView) {
      return (
        <div className="h-screen flex flex-col">
          <div className="p-4 border-b flex items-center gap-4 bg-card">
            <Button variant="ghost" onClick={onBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <h1 className="font-semibold">Select Metrics & Framework</h1>
          </div>
          <div className="flex-1 overflow-hidden">
            <MetricsFrameworkView
              metrics={metrics}
              selectedMetricIds={selectedMetricIds}
              onToggleMetric={toggleMetric}
              onApprove={handleApprove}
              isLoading={isLoading}
              conversationHistory={conversationHistory}
              onSendMessage={onSendMessage}
              newMetricIds={newMetricIds}
              frameworkRecommendation={frameworkRecommendation}
              clarifyingQuestions={clarifyingQuestions}
              onClarifyingAnswer={onClarifyingAnswer}
            />
          </div>
        </div>
      );
    }

    // Fallback to original panel view
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-2rem)]">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-4rem)]">
          <Card className="flex flex-col overflow-hidden">
            <AgentChat
              conversationHistory={conversationHistory}
              agentName="Product Analyst"
              agentDescription="Ask me about metrics, suggest alternatives, or request different recommendations"
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              placeholder="Ask about metrics or suggest alternatives..."
            />
          </Card>
          <Card className="flex flex-col overflow-hidden">
            <MetricSelectionPanel
              metrics={metrics}
              selectedMetricIds={selectedMetricIds}
              onToggleMetric={toggleMetric}
              onApprove={handleApprove}
              isLoading={isLoading}
              newMetricIds={newMetricIds}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Taxonomy approval with split panel
  if (requiresApproval && approvalType === 'taxonomy' && events.length > 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-2rem)]">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-4rem)]">
          {/* Left Panel - Chat */}
          <Card className="flex flex-col overflow-hidden">
            <AgentChat
              conversationHistory={conversationHistory}
              agentName="Instrumentation Architect"
              agentDescription="Ask me about the events, request changes, or suggest modifications"
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              placeholder="Ask about events or suggest changes..."
            />
          </Card>

          {/* Right Panel - Taxonomy Review */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Review Generated Taxonomy</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {events.length} events generated. Review and approve to finalize.
              </p>
            </div>

            <ScrollArea className="flex-1">
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
                    <tr key={index} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{event.event_name}</td>
                      <td className="p-3 text-xs">{event.trigger_action}</td>
                      <td className="p-3 text-xs">{event.screen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/30 flex gap-3">
              <Button variant="outline" onClick={onReject} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleApprove} disabled={isLoading} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Approve & Finalize
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your product...</p>
        </Card>
      </div>
    );
  }

  return null;
}
