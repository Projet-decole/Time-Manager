// frontend/src/components/features/time-tracking/template-mode/TemplateEntryForm.jsx
// Story 4.10: Implement Template Mode UI - Template Entry Form Component

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Input } from '../../../ui/Input';
import { Textarea } from '../../../ui/Textarea';
import { Select, SelectOption } from '../../../ui/Select';

/**
 * TemplateEntryForm - Form for adding/editing a time block in a template
 *
 * @param {Object} props
 * @param {Object} [props.entry] - Existing entry for edit (null for create)
 * @param {Array} props.projects - Available projects
 * @param {Array} props.categories - Available categories
 * @param {function} props.onSave - Save handler
 * @param {function} props.onCancel - Cancel handler
 * @param {function} [props.onDelete] - Delete handler (edit mode only)
 * @param {boolean} [props.isLoading=false] - Loading state
 */
export function TemplateEntryForm({
  entry,
  projects = [],
  categories = [],
  onSave,
  onCancel,
  onDelete,
  isLoading = false
}) {
  // Form state
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!entry;
  const maxDescriptionLength = 500;

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      setStartTime(entry.startTime || '09:00');
      setEndTime(entry.endTime || '10:00');
      setProjectId(entry.projectId || '');
      setCategoryId(entry.categoryId || '');
      setDescription(entry.description || '');
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
      setProjectId('');
      setCategoryId('');
      setDescription('');
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [entry]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    if (!startTime) {
      newErrors.startTime = 'Heure de debut requise';
    }
    if (!endTime) {
      newErrors.endTime = 'Heure de fin requise';
    }

    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'La fin doit etre apres le debut';
      }
    }

    if (description.length > maxDescriptionLength) {
      newErrors.description = `Maximum ${maxDescriptionLength} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [startTime, endTime, description]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const entryData = {
      startTime,
      endTime
    };

    if (projectId) entryData.projectId = projectId;
    if (categoryId) entryData.categoryId = categoryId;
    if (description.trim()) entryData.description = description.trim();

    onSave(entryData);
  }, [validate, startTime, endTime, projectId, categoryId, description, onSave]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [showDeleteConfirm, onDelete]);

  // Cancel delete confirmation
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // Handle description change
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxDescriptionLength) {
      setDescription(value);
    }
  };

  const remainingChars = maxDescriptionLength - description.length;

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium text-gray-900">
        {isEditMode ? 'Modifier le bloc' : 'Ajouter un bloc'}
      </h4>

      {/* Time inputs row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="entry-start-time" className="text-sm font-medium text-gray-700">
            Debut *
          </Label>
          <Input
            id="entry-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={errors.startTime ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.startTime && (
            <p className="text-xs text-red-500">{errors.startTime}</p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="entry-end-time" className="text-sm font-medium text-gray-700">
            Fin *
          </Label>
          <Input
            id="entry-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={errors.endTime ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.endTime && (
            <p className="text-xs text-red-500">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Project Selector */}
      <div className="space-y-2">
        <Label htmlFor="entry-project" className="text-sm font-medium text-gray-700">
          Projet
          <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
        </Label>
        <Select
          id="entry-project"
          value={projectId}
          onValueChange={setProjectId}
          placeholder="Selectionner un projet..."
          disabled={isLoading}
        >
          <SelectOption value="">Aucun projet</SelectOption>
          {projects.map((project) => (
            <SelectOption key={project.id} value={project.id}>
              {project.code ? `${project.code} - ${project.name}` : project.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Label htmlFor="entry-category" className="text-sm font-medium text-gray-700">
          Categorie
          <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
        </Label>
        <Select
          id="entry-category"
          value={categoryId}
          onValueChange={setCategoryId}
          placeholder="Selectionner une categorie..."
          disabled={isLoading}
        >
          <SelectOption value="">Aucune categorie</SelectOption>
          {categories.map((category) => (
            <SelectOption key={category.id} value={category.id}>
              {category.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="entry-description" className="text-sm font-medium text-gray-700">
            Description
            <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
          </Label>
          <span
            className={`text-xs ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-400'}`}
          >
            {remainingChars}/{maxDescriptionLength}
          </span>
        </div>
        <Textarea
          id="entry-description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Ajouter une description..."
          className="w-full min-h-[60px]"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        {/* Delete button (edit mode only) */}
        {isEditMode && onDelete && (
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confirmer?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDelete}
                  disabled={isLoading}
                >
                  Non
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Supprimer
              </Button>
            )}
          </div>
        )}

        {/* Save/Cancel buttons */}
        <div className={`flex items-center gap-2 ${!isEditMode || !onDelete ? 'ml-auto' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : isEditMode ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TemplateEntryForm;
