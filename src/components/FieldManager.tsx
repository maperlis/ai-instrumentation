import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TaxonomyField, DEFAULT_TAXONOMY_FIELDS } from "@/types/taxonomy";
import { Plus, Pencil, RotateCcw, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FieldManagerProps {
  fields: TaxonomyField[];
  onFieldsChange: (fields: TaxonomyField[]) => void;
}

export const FieldManager = ({ fields, onFieldsChange }: FieldManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<TaxonomyField | null>(null);
  const [formData, setFormData] = useState<Partial<TaxonomyField>>({
    type: 'text',
    required: false,
  });

  const handleAddField = () => {
    setEditingField(null);
    setFormData({ type: 'text', required: false });
    setShowDialog(true);
  };

  const handleEditField = (field: TaxonomyField) => {
    setEditingField(field);
    setFormData(field);
    setShowDialog(true);
  };

  const handleSaveField = () => {
    if (!formData.name) return;

    const fieldId = editingField?.id || formData.name.toLowerCase().replace(/\s+/g, '_');
    const newField: TaxonomyField = {
      id: fieldId,
      name: formData.name,
      type: formData.type || 'text',
      required: formData.required || false,
      description: formData.description,
    };

    if (editingField) {
      onFieldsChange(fields.map(f => f.id === editingField.id ? newField : f));
    } else {
      onFieldsChange([...fields, newField]);
    }

    setShowDialog(false);
    setFormData({ type: 'text', required: false });
  };

  const handleResetToDefault = () => {
    onFieldsChange(DEFAULT_TAXONOMY_FIELDS);
  };

  const isDefaultField = (fieldId: string) => {
    return DEFAULT_TAXONOMY_FIELDS.some(f => f.id === fieldId);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between gap-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Settings2 className="w-4 h-4" />
            <span className="font-medium">Taxonomy Fields</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        {/* Compact field preview when collapsed */}
        {!isOpen && (
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {fields.slice(0, 6).map((field) => (
              <Badge 
                key={field.id} 
                variant="secondary" 
                className="whitespace-nowrap text-xs cursor-pointer hover:bg-accent/20"
                onClick={() => {
                  setIsOpen(true);
                  handleEditField(field);
                }}
              >
                {field.name}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Badge>
            ))}
            {fields.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{fields.length - 6}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetToDefault} className="gap-1 text-xs">
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button size="sm" onClick={handleAddField} className="gap-1">
            <Plus className="w-3 h-3" />
            Add Field
          </Button>
        </div>
      </div>

      <CollapsibleContent className="mt-3">
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border rounded-lg bg-background hover:bg-accent/5 cursor-pointer transition-colors",
                "group"
              )}
              onClick={() => handleEditField(field)}
            >
              <span className="text-sm font-medium">{field.name}</span>
              {field.required && (
                <span className="text-xs text-destructive">*</span>
              )}
              <span className="text-xs text-muted-foreground">({field.type})</span>
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </CollapsibleContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                placeholder="e.g., Platform Type"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isDefaultField(editingField?.id || '')}
              />
            </div>

            <div>
              <Label htmlFor="field-description">Description (optional)</Label>
              <Textarea
                id="field-description"
                placeholder="Describe what this field captures..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="field-type">Field Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="field-required"
                checked={formData.required}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, required: checked as boolean })
                }
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Required field
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField} disabled={!formData.name}>
              {editingField ? 'Update' : 'Add'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};
