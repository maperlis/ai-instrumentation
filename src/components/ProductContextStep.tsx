import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Upload, FileText, Plus, Trash2, Edit2, Check, X, 
  Loader2, Sparkles, ClipboardPaste, Link2, Video, ChevronDown, ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SectionContainer } from "@/components/design-system";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExistingMetric } from "@/types/existingMetrics";
import { cn } from "@/lib/utils";

interface ProductContextStepProps {
  onComplete: (data: {
    existingMetrics: ExistingMetric[];
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  }) => void;
  isLoading: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  canSave?: boolean;
}

export function ProductContextStep({ onComplete, isLoading, onSave, isSaving, canSave }: ProductContextStepProps) {
  const { toast } = useToast();
  
  // Existing metrics state
  const [metrics, setMetrics] = useState<ExistingMetric[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDefinition, setEditDefinition] = useState("");
  const [metricsExpanded, setMetricsExpanded] = useState(false);

  // Product input state
  const [url, setUrl] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [videoFrameData, setVideoFrameData] = useState<string>("");
  const [inputTab, setInputTab] = useState<"url" | "image" | "video">("url");

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

        const header = lines[0].toLowerCase();
        const hasProperHeader = header.includes('name') && header.includes('definition');
        
        const parsedMetrics: ExistingMetric[] = [];
        const startLine = hasProperHeader ? 1 : 0;

        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.match(/(?:^|,)(\"(?:[^\"]*(?:""[^"]*)*)\"|[^,]*)/g)?.map(v => 
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
        setMetricsExpanded(true);
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
    e.target.value = '';
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
        setMetricsExpanded(true);
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
    setMetricsExpanded(true);
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

  // Image/Video handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video under 50MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedVideo(file);
      
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = videoUrl;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(3, video.duration / 2);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 1920);
        canvas.height = Math.min(video.videoHeight, 1080);
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.85);
          setVideoFrameData(frameData);
        }
        
        URL.revokeObjectURL(videoUrl);
      };
      
      video.onerror = () => {
        toast({
          title: "Video processing failed",
          description: "Could not process video file. Please try another file.",
          variant: "destructive",
        });
        URL.revokeObjectURL(videoUrl);
      };
    }
  };

  // Submit handler
  const handleSubmit = () => {
    // Validate we have at least some product context
    const hasUrl = inputTab === "url" && url.trim();
    const hasImage = inputTab === "image" && selectedImage;
    const hasVideo = inputTab === "video" && selectedVideo;

    if (!hasUrl && !hasImage && !hasVideo) {
      toast({
        title: "Product context required",
        description: "Please provide a URL, image, or video of your product",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty metrics
    const validMetrics = metrics.filter(m => m.name.trim());

    const requestData: any = {
      existingMetrics: validMetrics,
      productDetails: productDetails || undefined,
    };

    if (inputTab === "url") {
      requestData.url = url;
    } else if (inputTab === "image" && imagePreview) {
      requestData.imageData = imagePreview;
    } else if (inputTab === "video" && videoFrameData) {
      requestData.videoData = videoFrameData;
    }

    onComplete(requestData);
  };

  const validMetricsCount = metrics.filter(m => m.name.trim()).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30">
      <SectionContainer size="md" className="py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
            Step 1 of 4: Share your context
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Let's understand your product
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Share a quick snapshot of what you're building, and I'll recommend the best metrics framework and ask tailored follow-up questions.
          </p>
        </div>

        {/* Product Input Card */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as "url" | "image" | "video")} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="url" className="gap-2">
                <Link2 className="w-4 h-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <Upload className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Your Product URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://yourproduct.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details-url">Tell us about your product <span className="text-muted-foreground font-normal">(optional but helpful)</span></Label>
                <Textarea
                  id="details-url"
                  placeholder="E.g., 'SaaS tool for project management' or 'E-commerce marketplace connecting local artisans'"
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">This helps me ask better follow-up questions</p>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Upload a Design or Screenshot</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details-image">Tell us about your product <span className="text-muted-foreground font-normal">(optional but helpful)</span></Label>
                <Textarea
                  id="details-image"
                  placeholder="E.g., 'SaaS tool for project management' or 'E-commerce marketplace connecting local artisans'"
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">This helps me ask better follow-up questions</p>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video">Upload a Feature Demo Video</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label htmlFor="video" className="cursor-pointer">
                    {videoPreview ? (
                      <video
                        src={videoPreview}
                        controls
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV, WebM up to 50MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="details-video">Tell us about your product <span className="text-muted-foreground font-normal">(optional but helpful)</span></Label>
                <Textarea
                  id="details-video"
                  placeholder="E.g., 'SaaS tool for project management' or 'E-commerce marketplace connecting local artisans'"
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">This helps me ask better follow-up questions</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Existing Metrics Collapsible */}
        <Collapsible open={metricsExpanded} onOpenChange={setMetricsExpanded} className="mb-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-foreground">Import Existing Metrics</span>
                    <span className="text-muted-foreground ml-2 text-sm">(Optional)</span>
                  </div>
                  {validMetricsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {validMetricsCount} imported
                    </Badge>
                  )}
                </div>
                {metricsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-4 pt-0 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  Import your current metrics so the AI can tailor questions and recommendations.
                </p>

                {/* Import Options */}
                <Tabs defaultValue="csv" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="csv" className="gap-2 text-sm">
                      <Upload className="w-4 h-4" />
                      Upload CSV
                    </TabsTrigger>
                    <TabsTrigger value="paste" className="gap-2 text-sm">
                      <ClipboardPaste className="w-4 h-4" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="csv" className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        CSV should have <code className="bg-muted px-1 rounded">name</code> and <code className="bg-muted px-1 rounded">definition</code> columns
                      </p>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="hidden"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload CSV</p>
                        </label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-3">
                    <div className="space-y-2">
                      <Textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste metric names and definitions from Notion, Confluence, etc."
                        className="min-h-[100px] font-mono text-sm"
                      />
                      <Button
                        onClick={handleParseText}
                        disabled={isParsing || !pastedText.trim()}
                        size="sm"
                        className="w-full"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Parsing...
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

                {/* Metrics Table */}
                {metrics.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Imported Metrics</span>
                      <Button variant="ghost" size="sm" onClick={handleAddManual}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 text-xs font-medium text-muted-foreground">Name</th>
                            <th className="text-left p-2 text-xs font-medium text-muted-foreground">Definition</th>
                            <th className="w-16"></th>
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
                                    <td className="p-1">
                                      <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Metric name"
                                        className="h-8 text-sm"
                                        autoFocus
                                      />
                                    </td>
                                    <td className="p-1">
                                      <Input
                                        value={editDefinition}
                                        onChange={(e) => setEditDefinition(e.target.value)}
                                        placeholder="Definition"
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="p-1">
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
                                          <Check className="w-3 h-3 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                                          <X className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-2 font-medium">{metric.name || <span className="text-muted-foreground italic">Untitled</span>}</td>
                                    <td className="p-2 text-muted-foreground">{metric.definition || <span className="italic">No definition</span>}</td>
                                    <td className="p-2">
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(metric)}>
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMetric(metric.id)}>
                                          <Trash2 className="w-3 h-3 text-destructive" />
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
                  </div>
                )}

                {metrics.length === 0 && (
                  <Button variant="outline" size="sm" onClick={handleAddManual} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Metric Manually
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Submit Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Start Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          {onSave && (
            <Button
              variant="outline"
              onClick={onSave}
              disabled={isSaving || !canSave}
              className="w-full"
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save for Later"
              )}
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground text-center">I'll analyze this and ask tailored follow-up questions next</p>
        </div>

        {/* What happens next */}
        <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            What happens next?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold shrink-0">1</div>
              <p className="text-sm text-muted-foreground">You'll answer a few quick questions</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold shrink-0">2</div>
              <p className="text-sm text-muted-foreground">Get your personalized metrics framework</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold shrink-0">3</div>
              <p className="text-sm text-muted-foreground">Get your Instrumentation Plan</p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
