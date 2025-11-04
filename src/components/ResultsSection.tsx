import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaxonomyEvent } from "@/types/taxonomy";
import { Download, FileJson, FileSpreadsheet, CheckCircle2, Send, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventTable } from "@/components/EventTable";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResultsSectionProps {
  results: TaxonomyEvent[];
  selectedMetrics?: string[];
}

export const ResultsSection = ({ results, selectedMetrics = [] }: ResultsSectionProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<TaxonomyEvent[]>(results);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const headers = [
      "Event Name",
      "Description",
      "Trigger Action",
      "Screen",
      "Event Properties",
      "Owner",
      "Notes",
      "Confidence",
    ];

    const rows = events.map((event) => [
      event.event_name,
      event.description,
      event.trigger_action,
      event.screen,
      event.event_properties.join("; "),
      event.owner,
      event.notes,
      event.confidence?.toFixed(2) || "N/A",
    ]);

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

      // Set editable ticket data
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

  const avgConfidence = events.reduce((acc, e) => acc + (e.confidence || 0), 0) / events.length;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Generated Taxonomy</h2>
            <p className="text-muted-foreground">
              {events.length} events identified with {(avgConfidence * 100).toFixed(0)}% avg
              confidence
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadJSON} variant="outline" className="gap-2">
              <FileJson className="w-4 h-4" />
              Export JSON
            </Button>
            <Button onClick={downloadCSV} variant="outline" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={handlePrepareTicket} disabled={isSubmitting} className="gap-2">
              <Send className="w-4 h-4" />
              {isSubmitting ? "Preparing..." : "Submit Taxonomy"}
            </Button>
          </div>
        </div>

        <Card className="p-6 bg-accent/5 border-accent">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Naming Convention</h3>
              <p className="text-sm text-muted-foreground">
                Events follow the <code className="px-2 py-1 bg-muted rounded">
                  product_area_action_object
                </code> pattern using snake_case for consistency
              </p>
            </div>
          </div>
        </Card>

        <EventTable events={events} onEventsChange={setEvents} />
      </div>

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
              <CheckCircle2 className="w-5 h-5 text-success" />
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
    </div>
  );
};
