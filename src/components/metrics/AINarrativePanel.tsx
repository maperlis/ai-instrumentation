import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Edit2, Save, X, ChevronRight, Tag, Settings2, Calculator, HelpCircle, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MetricNode } from "@/types/metricsFramework";
import { cn } from "@/lib/utils";

interface AINarrativePanelProps {
  narrative: string;
  selectedMetric?: MetricNode | null;
  onMetricUpdate?: (metric: MetricNode) => void;
  isLoading?: boolean;
  onClose?: () => void;
}

export function AINarrativePanel({
  narrative,
  selectedMetric,
  onMetricUpdate,
  isLoading,
  onClose,
}: AINarrativePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetric, setEditedMetric] = useState<MetricNode | null>(null);

  const handleEditStart = () => {
    if (selectedMetric) {
      setEditedMetric({ ...selectedMetric });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editedMetric && onMetricUpdate) {
      onMetricUpdate(editedMetric);
    }
    setIsEditing(false);
    setEditedMetric(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedMetric(null);
  };

  // Parse business questions from narrative or use metric's businessQuestions
  const getBusinessQuestions = (): string[] => {
    if (selectedMetric?.businessQuestions && selectedMetric.businessQuestions.length > 0) {
      return selectedMetric.businessQuestions;
    }
    // Default placeholder questions if none provided
    return [
      "How is this metric trending over time?",
      "What factors are driving changes in this metric?",
      "How does this metric compare across segments?"
    ];
  };

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Your metrics co-pilot</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <PanelRightClose className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Selected Metric Details - Now First */}
          <AnimatePresence mode="wait">
            {selectedMetric && (
              <motion.div
                key={selectedMetric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Settings2 className="w-3 h-3" />
                    Selected Metric
                  </h4>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditStart}
                      className="h-7 text-xs"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing && editedMetric ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <Input
                        value={editedMetric.name}
                        onChange={(e) =>
                          setEditedMetric({ ...editedMetric, name: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Description</label>
                      <Textarea
                        value={editedMetric.description}
                        onChange={(e) =>
                          setEditedMetric({ ...editedMetric, description: e.target.value })
                        }
                        className="mt-1 text-sm resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Calculation</label>
                      <Input
                        value={editedMetric.calculation || ''}
                        onChange={(e) =>
                          setEditedMetric({ ...editedMetric, calculation: e.target.value })
                        }
                        placeholder="e.g., Revenue / Active Users"
                        className="mt-1 h-8 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Input
                        value={editedMetric.category}
                        onChange={(e) =>
                          setEditedMetric({ ...editedMetric, category: e.target.value })
                        }
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="flex-1 h-8"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Metric Name & Tags */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-semibold text-base">{selectedMetric.name}</h5>
                        {selectedMetric.isNorthStar && (
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/30 shrink-0">
                            ⭐ North Star
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {selectedMetric.category}
                        </Badge>
                        {selectedMetric.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs capitalize",
                              selectedMetric.status === 'healthy' && "border-success text-success",
                              selectedMetric.status === 'warning' && "border-warning text-warning",
                              selectedMetric.status === 'critical' && "border-destructive text-destructive"
                            )}
                          >
                            {selectedMetric.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Definition */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Definition
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedMetric.description}
                      </p>
                    </div>

                    {/* Calculation */}
                    {selectedMetric.calculation && (
                      <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Calculation
                          </p>
                        </div>
                        <p className="text-sm font-mono text-foreground">
                          {selectedMetric.calculation}
                        </p>
                      </div>
                    )}

                    {/* Influence Description */}
                    {selectedMetric.influenceDescription && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Influence
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {selectedMetric.influenceDescription}
                        </p>
                      </div>
                    )}

                    {/* Example Events */}
                    {selectedMetric.example_events && selectedMetric.example_events.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Related Events
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMetric.example_events.map((event, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-mono">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state when no metric selected */}
          {!selectedMetric && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select a metric to view and edit its details
              </p>
            </div>
          )}

          {selectedMetric && <Separator />}

          {/* Business Questions Analysis - Now Second */}
          {selectedMetric && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <HelpCircle className="w-3 h-3" />
                Business Questions
              </h4>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-4 bg-muted rounded animate-pulse"
                        style={{ width: `${100 - i * 15}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {getBusinessQuestions().map((question, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          )}

          {/* General Analysis for when no metric is selected */}
          {!selectedMetric && narrative && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                Analysis
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {narrative}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer tip */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: Click any metric to see detailed insights
        </p>
      </div>
    </div>
  );
}
