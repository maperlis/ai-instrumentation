import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TaxonomyField, DEFAULT_TAXONOMY_FIELDS } from "@/types/taxonomy";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface FieldManagerProps {
  fields: TaxonomyField[];
  onFieldsChange: (fields: TaxonomyField[]) => void;
}

export const FieldManager = ({ fields, onFieldsChange }: FieldManagerProps) => {
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

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
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
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">Taxonomy Fields</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
          <Button size="sm" onClick={handleAddField} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Field
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{field.name}</span>
                {field.required && (
                  <span className="text-xs text-destructive">*</span>
                )}
                <span className="text-xs text-muted-foreground">({field.type})</span>
              </div>
              {field.description && (
                <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditField(field)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {!isDefaultField(field.id) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteField(field.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </Card>
  );
};
