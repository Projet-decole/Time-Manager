// frontend/src/components/features/time-tracking/template-mode/TemplateBuilderModal.jsx
// Story 4.10: Implement Template Mode UI - Template Builder Modal Component

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Input } from '../../../ui/Input';
import { Textarea } from '../../../ui/Textarea';
import { TemplateEntryItem } from './TemplateEntryItem';
import { TemplateEntryForm } from './TemplateEntryForm';

/**
 * TemplateBuilderModal - Create/Edit template form
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} [props.template] - Existing template for edit (null for create)
 * @param {Array} props.projects - Available projects
 * @param {Array} props.categories - Available categories
 * @param {function} props.onSave - Save handler (receives template data)
 * @param {boolean} [props.isLoading=false] - Loading state
 */
export function TemplateBuilderModal({
  open,
  onClose,
  template,
  projects = [],
  categories = [],
  onSave,
  isLoading = false
}) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState({});
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState(null);

  const isEditMode = !!template;
  const maxNameLength = 100;
  const maxDescriptionLength = 500;

  // Initialize form when modal opens or template changes
  useEffect(() => {
    if (open) {
      if (template) {
        // Edit mode: populate from template
        setName(template.name || '');
        setDescription(template.description || '');
        setEntries(template.entries || []);
      } else {
        // Create mode: reset form
        setName('');
        setDescription('');
        setEntries([]);
      }
      setErrors({});
      setShowEntryForm(false);
      setEditingEntryIndex(null);
    }
  }, [open, template]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (name.length > maxNameLength) {
      newErrors.name = `Maximum ${maxNameLength} caracteres`;
    }

    if (description.length > maxDescriptionLength) {
      newErrors.description = `Maximum ${maxDescriptionLength} caracteres`;
    }

    if (entries.length === 0) {
      newErrors.entries = 'Au moins un bloc est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, description, entries]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const templateData = {
      name: name.trim(),
      entries: entries.map(entry => ({
        startTime: entry.startTime,
        endTime: entry.endTime,
        ...(entry.projectId && { projectId: entry.projectId }),
        ...(entry.categoryId && { categoryId: entry.categoryId }),
        ...(entry.description && { description: entry.description })
      }))
    };

    if (description.trim()) {
      templateData.description = description.trim();
    }

    onSave(templateData);
  }, [validate, name, description, entries, onSave]);

  // Handle name change
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxNameLength) {
      setName(value);
    }
  };

  // Handle description change
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxDescriptionLength) {
      setDescription(value);
    }
  };

  // Handle add entry
  const handleAddEntry = () => {
    setEditingEntryIndex(null);
    setShowEntryForm(true);
  };

  // Handle edit entry
  const handleEditEntry = (index) => {
    setEditingEntryIndex(index);
    setShowEntryForm(true);
  };

  // Handle save entry
  const handleSaveEntry = (entryData) => {
    // Find project and category objects for display
    const project = projects.find(p => p.id === entryData.projectId);
    const category = categories.find(c => c.id === entryData.categoryId);

    const entryWithRefs = {
      ...entryData,
      project,
      category
    };

    if (editingEntryIndex !== null) {
      // Update existing entry
      const newEntries = [...entries];
      newEntries[editingEntryIndex] = entryWithRefs;
      setEntries(newEntries);
    } else {
      // Add new entry
      setEntries([...entries, entryWithRefs]);
    }

    setShowEntryForm(false);
    setEditingEntryIndex(null);
  };

  // Handle delete entry
  const handleDeleteEntry = () => {
    if (editingEntryIndex !== null) {
      const newEntries = entries.filter((_, index) => index !== editingEntryIndex);
      setEntries(newEntries);
      setShowEntryForm(false);
      setEditingEntryIndex(null);
    }
  };

  // Handle cancel entry form
  const handleCancelEntry = () => {
    setShowEntryForm(false);
    setEditingEntryIndex(null);
  };

  // Sort entries by start time
  const sortedEntries = [...entries].sort((a, b) => {
    const aTime = a.startTime || '00:00';
    const bTime = b.startTime || '00:00';
    return aTime.localeCompare(bTime);
  });

  const nameRemaining = maxNameLength - name.length;
  const descriptionRemaining = maxDescriptionLength - description.length;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEditMode ? 'Modifier le template' : 'Nouveau template'}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Name field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-name" className="text-sm font-medium text-gray-700">
              Nom du template *
            </Label>
            <span
              className={`text-xs ${nameRemaining < 20 ? 'text-orange-500' : 'text-gray-400'}`}
            >
              {nameRemaining}/{maxNameLength}
            </span>
          </div>
          <Input
            id="template-name"
            value={name}
            onChange={handleNameChange}
            placeholder="Ex: Journee standard de developpement"
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-description" className="text-sm font-medium text-gray-700">
              Description
              <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
            </Label>
            <span
              className={`text-xs ${descriptionRemaining < 50 ? 'text-orange-500' : 'text-gray-400'}`}
            >
              {descriptionRemaining}/{maxDescriptionLength}
            </span>
          </div>
          <Textarea
            id="template-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Decrivez ce template..."
            className="w-full min-h-[80px]"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Time blocks section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Blocs de temps
              {entries.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  ({entries.length} bloc{entries.length !== 1 ? 's' : ''})
                </span>
              )}
            </h4>
          </div>

          {/* Error for no entries */}
          {errors.entries && (
            <p className="text-xs text-red-500">{errors.entries}</p>
          )}

          {/* Entry form */}
          {showEntryForm && (
            <TemplateEntryForm
              entry={editingEntryIndex !== null ? entries[editingEntryIndex] : null}
              projects={projects}
              categories={categories}
              onSave={handleSaveEntry}
              onCancel={handleCancelEntry}
              onDelete={editingEntryIndex !== null ? handleDeleteEntry : undefined}
              isLoading={isLoading}
            />
          )}

          {/* Existing entries list */}
          {!showEntryForm && sortedEntries.length > 0 && (
            <div className="space-y-2">
              {sortedEntries.map((entry) => {
                // Find the original index for editing
                const originalIndex = entries.findIndex(e => e === entry);
                return (
                  <TemplateEntryItem
                    key={originalIndex}
                    entry={entry}
                    onClick={() => handleEditEntry(originalIndex)}
                  />
                );
              })}
            </div>
          )}

          {/* Add entry button */}
          {!showEntryForm && (
            <Button
              variant="outline"
              onClick={handleAddEntry}
              disabled={isLoading}
              className="w-full"
            >
              <span className="flex items-center gap-2">
                <PlusIcon />
                Ajouter un bloc
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || showEntryForm}
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  );
}

// Plus icon
function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default TemplateBuilderModal;
