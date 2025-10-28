import { useState } from "react";
import { TaxonomyEvent } from "@/types/taxonomy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EventTableProps {
  events: TaxonomyEvent[];
  onEventsChange: (events: TaxonomyEvent[]) => void;
}

export const EventTable = ({ events, onEventsChange }: EventTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedEvent, setEditedEvent] = useState<TaxonomyEvent | null>(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditedEvent({ ...events[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedEvent(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedEvent) {
      const updated = [...events];
      updated[editingIndex] = editedEvent;
      onEventsChange(updated);
      cancelEdit();
    }
  };

  const deleteEvent = (index: number) => {
    const updated = events.filter((_, i) => i !== index);
    onEventsChange(updated);
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return <Badge variant="secondary">N/A</Badge>;
    if (confidence >= 0.8)
      return <Badge className="bg-success text-success-foreground">High ({(confidence * 100).toFixed(0)}%)</Badge>;
    if (confidence >= 0.5)
      return <Badge className="bg-warning text-warning-foreground">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="destructive">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Screen</TableHead>
            <TableHead>Properties</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event, index) => (
            <TableRow key={index}>
              {editingIndex === index ? (
                <>
                  <TableCell>
                    <Input
                      value={editedEvent?.event_name || ""}
                      onChange={(e) =>
                        setEditedEvent({ ...editedEvent!, event_name: e.target.value })
                      }
                      className="min-w-[150px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editedEvent?.description || ""}
                      onChange={(e) =>
                        setEditedEvent({ ...editedEvent!, description: e.target.value })
                      }
                      className="min-w-[200px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editedEvent?.trigger_action || ""}
                      onChange={(e) =>
                        setEditedEvent({ ...editedEvent!, trigger_action: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editedEvent?.screen || ""}
                      onChange={(e) =>
                        setEditedEvent({ ...editedEvent!, screen: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editedEvent?.event_properties.join(", ") || ""}
                      onChange={(e) =>
                        setEditedEvent({
                          ...editedEvent!,
                          event_properties: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                      className="min-w-[150px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editedEvent?.owner || ""}
                      onChange={(e) =>
                        setEditedEvent({ ...editedEvent!, owner: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>{getConfidenceBadge(event.confidence)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={saveEdit}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-mono text-sm">{event.event_name}</TableCell>
                  <TableCell className="max-w-[250px]">{event.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.trigger_action}</Badge>
                  </TableCell>
                  <TableCell>{event.screen}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {event.event_properties.slice(0, 2).map((prop, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {prop}
                        </Badge>
                      ))}
                      {event.event_properties.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.event_properties.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{event.owner}</TableCell>
                  <TableCell>{getConfidenceBadge(event.confidence)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(index)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEvent(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
