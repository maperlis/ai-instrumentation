import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Upload, Link2, Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TaxonomyEvent } from "@/types/taxonomy";

interface InputSectionProps {
  onMetricsGenerated: (metrics: any[], data: any) => void;
  onTaxonomyGenerated: (results: TaxonomyEvent[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  inputData?: { url?: string; imageData?: string; videoData?: string; productDetails?: string } | null;
  selectedMetrics?: string[];
}

export const InputSection = ({ 
  onMetricsGenerated, 
  onTaxonomyGenerated, 
  isLoading, 
  setIsLoading,
  inputData: savedInputData,
  selectedMetrics 
}: InputSectionProps) => {
  const [url, setUrl] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const { toast } = useToast();

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (inputType: "url" | "image" | "video") => {
    if (inputType === "url" && !url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    if (inputType === "image" && !selectedImage) {
      toast({
        title: "Image required",
        description: "Please select an image to analyze",
        variant: "destructive",
      });
      return;
    }

    if (inputType === "video" && !selectedVideo) {
      toast({
        title: "Video required",
        description: "Please select a video to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const requestData: any = {
        productDetails: productDetails || undefined,
      };

      if (inputType === "url") {
        requestData.url = url;
      } else if (inputType === "image" && imagePreview) {
        requestData.imageData = imagePreview;
      } else if (inputType === "video" && videoPreview) {
        requestData.videoData = videoPreview;
      }

      // Check if we're coming from metrics selection
      if (selectedMetrics && selectedMetrics.length > 0) {
        // Generate taxonomy based on selected metrics
        requestData.mode = 'taxonomy';
        requestData.selectedMetrics = selectedMetrics;

        const { data, error } = await supabase.functions.invoke("generate-taxonomy", {
          body: requestData,
        });

        if (error) throw error;

        if (data?.events) {
          onTaxonomyGenerated(data.events);
          toast({
            title: "Taxonomy generated!",
            description: `Successfully generated ${data.events.length} events`,
          });
        }
      } else {
        // First step: generate metrics recommendations
        requestData.mode = 'metrics';

        const { data, error } = await supabase.functions.invoke("generate-taxonomy", {
          body: requestData,
        });

        if (error) throw error;

        if (data?.metrics) {
          onMetricsGenerated(data.metrics, requestData);
          toast({
            title: "Metrics identified!",
            description: `Found ${data.metrics.length} relevant metrics`,
          });
        }
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20">
      <Card className="max-w-3xl mx-auto p-8 shadow-lg">
        <Tabs defaultValue="url" className="w-full">
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
              <Label htmlFor="url">Product URL</Label>
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
              <Label htmlFor="details-url">Product Details (Optional)</Label>
              <Textarea
                id="details-url"
                placeholder="Describe your product, main features, or user journey goals..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button
              onClick={() => handleGenerate("url")}
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
                "Generate Taxonomy"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Design Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
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
              <Label htmlFor="details-image">Product Details (Optional)</Label>
              <Textarea
                id="details-image"
                placeholder="Describe your product, main features, or user journey goals..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button
              onClick={() => handleGenerate("image")}
              disabled={isLoading || !selectedImage}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Generate Taxonomy"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video">Feature Demo Video</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
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
              <Label htmlFor="details-video">Product Details (Optional)</Label>
              <Textarea
                id="details-video"
                placeholder="Describe your product, main features, or user journey goals..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <Button
              onClick={() => handleGenerate("video")}
              disabled={isLoading || !selectedVideo}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Generate Taxonomy"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
