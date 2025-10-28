import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaxonomyEvent } from "@/types/taxonomy";
import { Download, FileJson, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventTable } from "@/components/EventTable";

interface ResultsSectionProps {
  results: TaxonomyEvent[];
}

export const ResultsSection = ({ results }: ResultsSectionProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<TaxonomyEvent[]>(results);

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
    </div>
  );
};
