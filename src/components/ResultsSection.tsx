import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaxonomyEvent, TaxonomyField, DEFAULT_TAXONOMY_FIELDS } from "@/types/taxonomy";
import { ConversationMessage } from "@/types/orchestration";
import { Download, FileJson, FileSpreadsheet, CheckCircle2, Send, Copy, ExternalLink, RefreshCw, Upload, Bot, User, ChevronLeft, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventTable } from "@/components/EventTable";
import { FieldManager } from "@/components/FieldManager";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ResultsSectionProps {
  results: TaxonomyEvent[];
  selectedMetrics?: string[];
  inputData?: {
    url?: string;
    imageData?: string;
    videoData?: string;
    productDetails?: string;
  };
  conversationHistory?: ConversationMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export const ResultsSection = ({ 
  results, 
  selectedMetrics = [], 
  inputData,
  conversationHistory = [],
  onSendMessage,
  isLoading = false,
}: ResultsSectionProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<TaxonomyEvent[]>(results);
  const [fields, setFields] = useState<TaxonomyField[]>(DEFAULT_TAXONOMY_FIELDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [editableTicket, setEditableTicket] = useState<{
    title: string;
    description: string;
    labels: string;
    priority: string;
  }>({
    title: "",
    description: "",
    labels: "",
    priority: "Medium",
  });
  const [showAmplitudeDialog, setShowAmplitudeDialog] = useState(false);
  const [amplitudeCredentials, setAmplitudeCredentials] = useState({
    apiKey: "",
    region: "US" as "US" | "EU",
    projectName: "",
  });
  const [amplitudeDryRun, setAmplitudeDryRun] = useState(false);
  const [amplitudeResult, setAmplitudeResult] = useState<any>(null);
  const [showAmplitudeResultDialog, setShowAmplitudeResultDialog] = useState(false);
  const [showLoaderDialog, setShowLoaderDialog] = useState(false);
  const [loaderScript, setLoaderScript] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update events when results change
  useEffect(() => {
    setEvents(results);
  }, [results]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && onSendMessage) {
      onSendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxonomy.json";
    link.click();
    toast({
      title: "Downloaded",
      description: "Taxonomy exported as JSON",
    });
  };

  const downloadCSV = () => {
    const headers = fields.map(f => f.name);

    const rows = events.map((event) => 
      fields.map(field => {
        const value = event[field.id];
        if (Array.isArray(value)) {
          return value.join("; ");
        }
        if (field.id === 'confidence' && typeof value === 'number') {
          return value.toFixed(2);
        }
        return value || "N/A";
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const dataBlob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxonomy.csv";
    link.click();
    toast({
      title: "Downloaded",
      description: "Taxonomy exported as CSV",
    });
  };

  const handlePrepareTicket = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-ticket", {
        body: {
          events,
          selectedMetrics,
        },
      });

      if (error) throw error;

      setEditableTicket({
        title: data.ticketContent.title,
        description: data.ticketContent.description,
        labels: data.ticketContent.labels.join(", "),
        priority: data.ticketContent.priority,
      });
      setTicketData(data);
      setShowEditDialog(true);
    } catch (error) {
      console.error("Error preparing ticket:", error);
      toast({
        title: "Error",
        description: "Failed to prepare ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToJira = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-ticket", {
        body: {
          events,
          selectedMetrics,
          customTicket: {
            title: editableTicket.title,
            description: editableTicket.description,
            labels: editableTicket.labels.split(",").map(l => l.trim()).filter(Boolean),
            priority: editableTicket.priority,
          },
        },
      });

      if (error) throw error;

      setShowEditDialog(false);
      setTicketData(data);
      setShowTicketDialog(true);

      if (data.jiraTicket) {
        toast({
          title: "JIRA Ticket Created",
          description: `Ticket ${data.jiraTicket.key} has been created successfully.`,
        });
      } else {
        toast({
          title: "Ticket Generated",
          description: "Copy the ticket details to your issue tracking platform.",
        });
      }
    } catch (error) {
      console.error("Error submitting to JIRA:", error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketToClipboard = () => {
    if (!ticketData?.ticketContent) return;
    
    const content = `${ticketData.ticketContent.title}\n\n${ticketData.ticketContent.description}`;
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Ticket content copied to clipboard",
    });
  };

  const handleRegenerateTaxonomy = async () => {
    if (!inputData) {
      toast({
        title: "Error",
        description: "No input data available for regeneration",
        variant: "destructive",
      });
      return;
    }

    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-taxonomy', {
        body: {
          ...inputData,
          mode: 'taxonomy',
          selectedMetrics,
          customFields: fields,
        },
      });

      if (error) throw error;

      if (data?.events) {
        setEvents(data.events);
        toast({
          title: "Taxonomy Regenerated",
          description: `Generated ${data.events.length} events with custom fields`,
        });
      }
    } catch (error) {
      console.error("Error regenerating taxonomy:", error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate taxonomy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePushToAmplitude = async () => {
    if (!amplitudeCredentials.apiKey) {
      toast({
        title: "Error",
        description: "Please provide your Amplitude API Key",
        variant: "destructive",
      });
      return;
    }

    if (!amplitudeCredentials.projectName && !amplitudeDryRun) {
      toast({
        title: "Error",
        description: "Please provide a project name for the instrumentation loader",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('push-taxonomy-to-amplitude', {
        body: {
          credentials: {
            apiKey: amplitudeCredentials.apiKey,
            region: amplitudeCredentials.region,
          },
          taxonomy: events,
          dryRun: amplitudeDryRun,
          projectName: amplitudeCredentials.projectName || null,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to sync with Amplitude");
      }

      setAmplitudeResult(data.result);
      setShowAmplitudeDialog(false);
      setShowAmplitudeResultDialog(true);

      if (!amplitudeDryRun && data.projectName) {
        const projectUrl = window.location.origin;
        const script = generateLoaderScript(projectUrl, data.projectName);
        setLoaderScript(script);
      }

      toast({
        title: amplitudeDryRun ? "Dry Run Complete" : "Sync Complete",
        description: amplitudeDryRun 
          ? "Preview shows what would be sent"
          : `Successfully sent ${data.result.events_created} sample events to register taxonomy`,
      });
    } catch (error: any) {
      console.error("Error pushing to Amplitude:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with Amplitude. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateLoaderScript = (baseUrl: string, projectName: string): string => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `<!-- Amplitude Auto-Instrumentation Loader -->
<script>
(function() {
  // Configuration
  const CONFIG_URL = '${supabaseUrl}/functions/v1/events-config?project=${encodeURIComponent(projectName)}';
  
  // Fetch event configuration
  fetch(CONFIG_URL)
    .then(response => response.json())
    .then(config => {
      // Initialize Amplitude
      const script = document.createElement('script');
      script.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.0.0-min.js.gz';
      script.async = true;
      
      script.onload = function() {
        // Initialize Amplitude with API key from config
        const region = config.amplitude_region === 'EU' ? 'EU' : 'US';
        window.amplitude.init(config.amplitude_api_key, {
          serverZone: region,
          defaultTracking: true
        });
        
        // Attach event listeners for each configured event
        config.events.forEach(function(event) {
          const elements = document.querySelectorAll(event.selector);
          
          elements.forEach(function(element) {
            element.addEventListener(event.trigger, function(e) {
              // Build event properties from data attributes
              const properties = {};
              event.properties.forEach(function(prop) {
                const dataKey = 'data-' + prop.toLowerCase().replace(/_/g, '-');
                const value = element.getAttribute(dataKey);
                if (value !== null) {
                  properties[prop] = value;
                }
              });
              
              // Track the event
              window.amplitude.track(event.event_name, properties);
              console.log('[Amplitude] Tracked:', event.event_name, properties);
            });
          });
          
          console.log('[Amplitude] Attached listener for:', event.event_name, 'on', elements.length, 'elements');
        });
      };
      
      document.head.appendChild(script);
    })
    .catch(error => {
      console.error('[Amplitude] Failed to load config:', error);
    });
})();
</script>`;
  };

  const copyLoaderScript = () => {
    navigator.clipboard.writeText(loaderScript);
    toast({
      title: "Copied",
      description: "Loader script copied to clipboard",
    });
  };

  const avgConfidence = events.reduce((acc, e) => acc + (e.confidence || 0), 0) / events.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Event Taxonomy</h1>
          <p className="text-sm text-muted-foreground">
            {events.length} events • {(avgConfidence * 100).toFixed(0)}% avg confidence
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadJSON} variant="outline" size="sm" className="gap-2">
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
          <Button onClick={downloadCSV} variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </Button>
          <Button 
            onClick={() => setShowAmplitudeDialog(true)} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Amplitude
          </Button>
          <Button onClick={handlePrepareTicket} disabled={isSubmitting} size="sm" className="gap-2">
            <Send className="w-4 h-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div 
          className={cn(
            "border-r border-border bg-card flex flex-col transition-all duration-300",
            isChatCollapsed ? "w-12" : "w-96"
          )}
        >
          {isChatCollapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatCollapsed(false)}
                className="mb-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="writing-mode-vertical text-xs text-muted-foreground flex items-center gap-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                <MessageSquare className="h-4 w-4 rotate-90" />
                Instrumentation Architect
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Instrumentation Architect</h3>
                    <p className="text-xs text-muted-foreground">Ask about events or request changes</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {conversationHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Ask me to modify events, add properties, or explain the taxonomy</p>
                    </div>
                  ) : (
                    conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                          message.role === 'user' 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about events..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!chatInput.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Taxonomy Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Naming Convention Banner */}
          <div className="px-6 py-3 bg-accent/5 border-b border-border flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              Events follow <code className="px-1.5 py-0.5 bg-muted rounded text-xs">product_area_action_object</code> pattern
            </span>
          </div>

          {/* Field Manager */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <FieldManager fields={fields} onFieldsChange={setFields} />
              <Button
                onClick={handleRegenerateTaxonomy}
                disabled={isRegenerating}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          </div>

          {/* Event Table */}
          <div className="flex-1 overflow-auto p-6">
            <EventTable events={events} fields={fields} onEventsChange={setEvents} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ticket Details</DialogTitle>
            <DialogDescription>
              Review and edit the ticket details before submitting to JIRA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editableTicket.title}
                onChange={(e) => setEditableTicket({ ...editableTicket, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editableTicket.description}
                onChange={(e) => setEditableTicket({ ...editableTicket, description: e.target.value })}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labels">Labels (comma-separated)</Label>
                <Input
                  id="labels"
                  value={editableTicket.labels}
                  onChange={(e) => setEditableTicket({ ...editableTicket, labels: e.target.value })}
                  placeholder="analytics, instrumentation, tracking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  value={editableTicket.priority}
                  onChange={(e) => setEditableTicket({ ...editableTicket, priority: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitToJira} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit to JIRA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {ticketData?.jiraTicket ? "JIRA Ticket Created" : "Implementation Ticket"}
            </DialogTitle>
            <DialogDescription>
              {ticketData?.jiraTicket 
                ? "Your JIRA ticket has been created successfully." 
                : "Copy this ticket to your issue tracking platform."}
            </DialogDescription>
          </DialogHeader>

          {ticketData?.jiraTicket && (
            <div className="flex items-center gap-2 p-4 bg-accent/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">{ticketData.jiraTicket.key}</p>
                <p className="text-sm text-muted-foreground">
                  Ticket created in JIRA
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(ticketData.jiraTicket.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in JIRA
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Ticket Details</h3>
              <Button variant="outline" size="sm" onClick={copyTicketToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-2">{ticketData?.ticketContent?.title}</h4>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                  {ticketData?.ticketContent?.description}
                </pre>
              </div>
            </Card>

            {!ticketData?.jiraTicket && (
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> JIRA is not configured. To enable automatic ticket creation,
                  configure your JIRA credentials in the settings.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAmplitudeDialog} onOpenChange={setShowAmplitudeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Push Taxonomy to Amplitude</DialogTitle>
            <DialogDescription>
              Send sample events to register this taxonomy in your Amplitude project via the HTTP API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={amplitudeCredentials.projectName}
                onChange={(e) => setAmplitudeCredentials({ 
                  ...amplitudeCredentials, 
                  projectName: e.target.value 
                })}
                placeholder="my-website"
              />
              <p className="text-xs text-muted-foreground">
                A unique identifier for your website (used to generate the loader script)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={amplitudeCredentials.apiKey}
                onChange={(e) => setAmplitudeCredentials({ 
                  ...amplitudeCredentials, 
                  apiKey: e.target.value 
                })}
                placeholder="Enter your Amplitude API Key"
              />
              <p className="text-xs text-muted-foreground">
                Find this in Settings → Projects → [Your Project] → General
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={amplitudeCredentials.region}
                onValueChange={(value: "US" | "EU") => setAmplitudeCredentials({ 
                  ...amplitudeCredentials, 
                  region: value 
                })}
              >
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">US (Standard Server)</SelectItem>
                  <SelectItem value="EU">EU (EU Residency Server)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the region where your Amplitude project is hosted
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dry-run"
                checked={amplitudeDryRun}
                onCheckedChange={(checked) => setAmplitudeDryRun(checked === true)}
              />
              <Label htmlFor="dry-run" className="text-sm cursor-pointer">
                Dry Run (preview changes without applying them)
              </Label>
            </div>

            <div className="p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This will send {events.length} sample events via the HTTP API to register these event types in your Amplitude project.
                One sample event will be sent per event type with sample values for all defined properties.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmplitudeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePushToAmplitude} disabled={isSubmitting}>
              <Upload className="w-4 h-4 mr-2" />
              {isSubmitting ? "Syncing..." : amplitudeDryRun ? "Preview" : "Push to Amplitude"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAmplitudeResultDialog} onOpenChange={setShowAmplitudeResultDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amplitude Sync Results</DialogTitle>
            <DialogDescription>
              Summary of the sample event ingestion operation
            </DialogDescription>
          </DialogHeader>

          {amplitudeResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-green-500/10 border-green-500/20">
                  <h4 className="font-semibold mb-2 text-sm">Sample Events Sent</h4>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {amplitudeResult.events_created || 0}
                  </p>
                </Card>

                <Card className="p-4 bg-red-500/10 border-red-500/20">
                  <h4 className="font-semibold mb-2 text-sm">Events Failed</h4>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {amplitudeResult.events_failed || 0}
                  </p>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold mb-2 text-sm">Status</h4>
                <div className="space-y-1 text-sm">
                  {amplitudeResult.errors && amplitudeResult.errors.length === 0 ? (
                    <p className="text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      All sample events sent successfully
                    </p>
                  ) : (
                    <p className="text-red-600">
                      {amplitudeResult.errors?.length || 0} error(s) occurred
                    </p>
                  )}
                </div>
              </Card>

              {amplitudeResult.errors && amplitudeResult.errors.length > 0 && (
                <Card className="p-4 bg-destructive/10">
                  <h4 className="font-semibold mb-2 text-sm">Errors</h4>
                  <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                    {amplitudeResult.errors.map((error: string, index: number) => (
                      <p key={index} className="text-destructive">{error}</p>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            {loaderScript && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAmplitudeResultDialog(false);
                  setShowLoaderDialog(true);
                }}
              >
                View Setup Instructions
              </Button>
            )}
            <Button onClick={() => setShowAmplitudeResultDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoaderDialog} onOpenChange={setShowLoaderDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dynamic Instrumentation Setup</DialogTitle>
            <DialogDescription>
              Add this script to your website to automatically track events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="p-6 bg-accent/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Setup Instructions
              </h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold min-w-[1.5rem]">1.</span>
                  <span>Copy the loader script below and paste it into the <code className="px-2 py-0.5 bg-muted rounded">&lt;head&gt;</code> section of your website.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold min-w-[1.5rem]">2.</span>
                  <span>Add <code className="px-2 py-0.5 bg-muted rounded">data-event</code> attributes to elements you want to track, matching your event names.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold min-w-[1.5rem]">3.</span>
                  <span>Add optional data attributes for event properties (e.g., <code className="px-2 py-0.5 bg-muted rounded">data-button-type="primary"</code>).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold min-w-[1.5rem]">4.</span>
                  <span>Any future taxonomy updates will automatically apply without code changes!</span>
                </li>
              </ol>
            </Card>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Loader Script</Label>
                <Button variant="outline" size="sm" onClick={copyLoaderScript}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Script
                </Button>
              </div>
              <Card className="p-4">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {loaderScript}
                </pre>
              </Card>
            </div>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="font-semibold mb-2 text-sm">Example Usage</h4>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-background p-4 rounded-lg">
{`<!-- Button with event tracking -->
<button 
  data-event="checkout_button_click"
  data-button-type="primary"
  data-page="product"
>
  Checkout
</button>

<!-- Form with event tracking -->
<form 
  data-event="newsletter_signup_submit"
  data-source="homepage"
>
  <input type="email" name="email" />
  <button type="submit">Subscribe</button>
</form>

<!-- Link with event tracking -->
<a 
  href="/pricing" 
  data-event="pricing_page_view"
  data-referrer="navbar"
>
  View Pricing
</a>`}
              </pre>
            </Card>

            <Card className="p-4 bg-accent/10">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> The loader script fetches the latest event configuration from your stored taxonomy.
                When you push updates to Amplitude, the instrumentation will automatically update across all websites using this loader.
              </p>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowLoaderDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
