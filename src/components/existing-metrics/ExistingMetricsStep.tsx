import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Upload, FileText, Plus, Trash2, Edit2, Check, X, Loader2, Sparkles, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SectionContainer } from "@/components/design-system";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExistingMetric } from "@/types/existingMetrics";
import { cn } from "@/lib/utils";

interface ExistingMetricsStepProps {
  onComplete: (metrics: ExistingMetric[]) => void;
  onSkip: () => void;
}

export function ExistingMetricsStep({ onComplete, onSkip }: ExistingMetricsStepProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ExistingMetric[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDefinition, setEditDefinition] = useState("");

  // CSV Upload Handler
  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          toast({
            title: "Empty CSV",
            description: "The CSV file appears to be empty or only has headers",
            variant: "destructive",
          });
          return;
        }

        // Parse header to find name and definition columns
        const header = lines[0].toLowerCase();
        const hasProperHeader = header.includes('name') && header.includes('definition');
        
        const parsedMetrics: ExistingMetric[] = [];
        const startLine = hasProperHeader ? 1 : 0;

        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split by comma, handling quoted values
          const values = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)?.map(v => 
            v.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
          ) || [];

          if (values.length >= 2 && values[0] && values[1]) {
            parsedMetrics.push({
              id: `csv_${Date.now()}_${i}`,
              name: values[0],
              definition: values[1],
              source: 'csv',
            });
          }
        }

        if (parsedMetrics.length === 0) {
          toast({
            title: "No metrics found",
            description: "Could not parse any metrics from the CSV. Ensure it has 'name' and 'definition' columns.",
            variant: "destructive",
          });
          return;
        }

        setMetrics(prev => [...prev, ...parsedMetrics]);
        toast({
          title: "CSV imported",
          description: `Successfully imported ${parsedMetrics.length} metrics`,
        });
      } catch (error) {
        console.error("CSV parse error:", error);
        toast({
          title: "Parse error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }, [toast]);

  // Paste and Parse Handler
  const handleParseText = useCallback(async () => {
    if (!pastedText.trim()) {
      toast({
        title: "No text to parse",
        description: "Please paste some text containing your metrics",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-metrics-text', {
        body: { text: pastedText }
      });

      if (error) throw error;

      if (data?.metrics && data.metrics.length > 0) {
        const newMetrics: ExistingMetric[] = data.metrics.map((m: any, i: number) => ({
          id: `pasted_${Date.now()}_${i}`,
          name: m.name,
          definition: m.definition,
          source: 'pasted' as const,
        }));
        setMetrics(prev => [...prev, ...newMetrics]);
        setPastedText("");
        toast({
          title: "Text parsed",
          description: `Successfully extracted ${newMetrics.length} metrics`,
        });
      } else {
        toast({
          title: "No metrics found",
          description: "Could not extract any metrics from the text. Try a different format.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Parse error:", error);
      toast({
        title: "Parse failed",
        description: error.message || "Failed to parse text",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  }, [pastedText, toast]);

  // Add manual metric
  const handleAddManual = () => {
    const newMetric: ExistingMetric = {
      id: `manual_${Date.now()}`,
      name: "",
      definition: "",
      source: 'manual',
    };
    setMetrics(prev => [...prev, newMetric]);
    setEditingId(newMetric.id);
    setEditName("");
    setEditDefinition("");
  };

  // Edit handlers
  const startEdit = (metric: ExistingMetric) => {
    setEditingId(metric.id);
    setEditName(metric.name);
    setEditDefinition(metric.definition);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!editName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a metric name",
        variant: "destructive",
      });
      return;
    }
    setMetrics(prev => prev.map(m => 
      m.id === editingId 
        ? { ...m, name: editName.trim(), definition: editDefinition.trim() }
        : m
    ));
    setEditingId(null);
    setEditName("");
    setEditDefinition("");
  };

  const cancelEdit = () => {
    // Remove if it's a new empty metric
    const metric = metrics.find(m => m.id === editingId);
    if (metric && !metric.name && !metric.definition) {
      setMetrics(prev => prev.filter(m => m.id !== editingId));
    }
    setEditingId(null);
    setEditName("");
    setEditDefinition("");
  };

  const removeMetric = (id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
  };

  const handleContinue = () => {
    // Filter out any empty metrics
    const validMetrics = metrics.filter(m => m.name.trim());
    onComplete(validMetrics);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30">
      <SectionContainer size="md" className="py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
            Step 1 of 5: Import Existing Metrics (Optional)
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Do you have existing metrics?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Import your current metrics so the AI can tailor questions and recommendations. 
            You can skip this step if you're starting fresh.
          </p>
        </div>

        {/* Import Options */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="csv" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <ClipboardPaste className="w-4 h-4" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload CSV with metrics</Label>
                <p className="text-sm text-muted-foreground">
                  Your CSV should have two columns: <code className="bg-muted px-1 rounded">name</code> and <code className="bg-muted px-1 rounded">definition</code>
                </p>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CSV file with name, definition columns
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <Label>Paste your metrics definitions</Label>
                <p className="text-sm text-muted-foreground">
                  Paste raw text from Notion, Confluence, Sheets, or any document. 
                  AI will extract metric names and definitions.
                </p>
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Example:

Monthly Active Users - Users who have performed at least one action in the last 30 days

Signup Conversion Rate: The percentage of landing page visitors who complete the signup process

Retention Rate
Users who return within 7 days of their first session"
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button
                  onClick={handleParseText}
                  disabled={isParsing || !pastedText.trim()}
                  className="w-full"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Parse Text
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Metrics Table */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Your Metrics</h3>
              <p className="text-sm text-muted-foreground">
                {metrics.length} metric{metrics.length !== 1 ? 's' : ''} imported
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddManual}>
              <Plus className="w-4 h-4 mr-2" />
              Add Manually
            </Button>
          </div>

          {metrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No metrics imported yet</p>
              <p className="text-sm">Upload a CSV, paste text, or add manually</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground w-1/3">Metric Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Definition</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground w-24">Source</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {metrics.map((metric) => (
                      <motion.tr
                        key={metric.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group"
                      >
                        {editingId === metric.id ? (
                          <>
                            <td className="p-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Metric name"
                                className="h-9"
                                autoFocus
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={editDefinition}
                                onChange={(e) => setEditDefinition(e.target.value)}
                                placeholder="Definition"
                                className="h-9"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className="text-xs">
                                {metric.source}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEdit}>
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-medium">{metric.name || <span className="text-muted-foreground italic">Untitled</span>}</td>
                            <td className="p-3 text-muted-foreground text-sm">{metric.definition || <span className="italic">No definition</span>}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={cn("text-xs", {
                                "bg-blue-500/10 text-blue-600 border-blue-500/20": metric.source === 'csv',
                                "bg-purple-500/10 text-purple-600 border-purple-500/20": metric.source === 'pasted',
                                "bg-gray-500/10 text-gray-600 border-gray-500/20": metric.source === 'manual',
                              })}>
                                {metric.source}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(metric)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMetric(metric.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onSkip}>
            Skip this step
          </Button>
          <Button size="lg" onClick={handleContinue}>
            {metrics.length > 0 ? `Continue with ${metrics.length} metric${metrics.length !== 1 ? 's' : ''}` : 'Continue without metrics'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </SectionContainer>
    </div>
  );
}
