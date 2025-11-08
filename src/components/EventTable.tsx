import { useState } from "react";
import { TaxonomyEvent, TaxonomyField, DEFAULT_TAXONOMY_FIELDS } from "@/types/taxonomy";
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
  fields?: TaxonomyField[];
  onEventsChange: (events: TaxonomyEvent[]) => void;
}

export const EventTable = ({ events, fields = DEFAULT_TAXONOMY_FIELDS, onEventsChange }: EventTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedEvent, setEditedEvent] = useState<TaxonomyEvent | null>(null);

  const displayFields = fields.filter(f => f.id !== 'confidence');

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

  const renderCell = (event: TaxonomyEvent, field: TaxonomyField, isEditing: boolean) => {
    const value = event[field.id];

    if (isEditing) {
      if (field.type === 'array') {
        return (
          <Input
            value={Array.isArray(value) ? value.join(", ") : ""}
            onChange={(e) =>
              setEditedEvent({
                ...editedEvent!,
                [field.id]: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            className="min-w-[150px]"
          />
        );
      }
      return (
        <Input
          value={value || ""}
          onChange={(e) =>
            setEditedEvent({ ...editedEvent!, [field.id]: e.target.value })
          }
          className="min-w-[150px]"
        />
      );
    }

    // Display mode
    if (field.type === 'array' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((item, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      );
    }

    if (field.id === 'trigger_action') {
      return <Badge variant="outline">{value}</Badge>;
    }

    if (field.id === 'event_name') {
      return <span className="font-mono text-sm">{value}</span>;
    }

    return <span className={field.id === 'owner' ? 'text-sm text-muted-foreground' : ''}>{value}</span>;
  };

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {displayFields.map(field => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
            <TableHead>Confidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event, index) => (
            <TableRow key={index}>
              {editingIndex === index ? (
                <>
                  {displayFields.map(field => (
                    <TableCell key={field.id}>
                      {renderCell(editedEvent!, field, true)}
                    </TableCell>
                  ))}
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
                  {displayFields.map(field => (
                    <TableCell key={field.id} className={field.id === 'description' ? 'max-w-[250px]' : ''}>
                      {renderCell(event, field, false)}
                    </TableCell>
                  ))}
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
