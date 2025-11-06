import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Metric } from "@/types/taxonomy";
import { ArrowLeft, ArrowRight, Target, Plus } from "lucide-react";

interface MetricSelectionProps {
  metrics: Metric[];
  onBack: () => void;
  onContinue: (selectedMetrics: string[]) => void;
  isLoading: boolean;
}

export const MetricSelection = ({ metrics, onBack, onContinue, isLoading }: MetricSelectionProps) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [customMetrics, setCustomMetrics] = useState<Metric[]>([]);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricDescription, setNewMetricDescription] = useState("");

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleContinue = () => {
    if (selectedMetrics.length > 0) {
      onContinue(selectedMetrics);
    }
  };

  const handleAddMetric = () => {
    if (newMetricName.trim() && newMetricDescription.trim()) {
      const newMetric: Metric = {
        id: `custom-${Date.now()}`,
        name: newMetricName,
        description: newMetricDescription,
        category: "Custom Metrics",
        example_events: []
      };
      setCustomMetrics([...customMetrics, newMetric]);
      setNewMetricName("");
      setNewMetricDescription("");
      setShowAddMetric(false);
    }
  };

  const allMetrics = [...metrics, ...customMetrics];
  const groupedMetrics = allMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, Metric[]>);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-accent/20">
              <Target className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Select Your Metrics</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the metrics you want to measure. Your taxonomy will be optimized to capture the data needed for these metrics.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowAddMetric(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4" />
            Add Custom Metric
          </Button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
            <Card key={category} className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-accent">{category}</h3>
              <div className="space-y-4">
                {categoryMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-start gap-3 p-4 rounded-lg border hover:border-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleMetric(metric.id)}
                  >
                    <Checkbox
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{metric.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Example events:</span> {metric.example_events.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Input
          </Button>
          <Button
            onClick={handleContinue}
            disabled={selectedMetrics.length === 0 || isLoading}
            className="gap-2"
          >
            {isLoading ? "Generating Taxonomy..." : "Generate Taxonomy"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Metric</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="metric-name">Metric Name</Label>
              <Input
                id="metric-name"
                placeholder="e.g., Customer Satisfaction Rate"
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="metric-description">Why is this important to customers?</Label>
              <Textarea
                id="metric-description"
                placeholder="Describe why this metric matters from a customer's perspective..."
                value={newMetricDescription}
                onChange={(e) => setNewMetricDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMetric(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMetric}
              disabled={!newMetricName.trim() || !newMetricDescription.trim()}
            >
              Add Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
