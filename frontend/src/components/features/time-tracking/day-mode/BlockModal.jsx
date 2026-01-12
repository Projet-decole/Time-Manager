// frontend/src/components/features/time-tracking/day-mode/BlockModal.jsx
// Story 4.7: Day Mode UI with Timeline - Create/Edit Block Modal

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Select, SelectOption } from '../../../ui/Select';
import { Textarea } from '../../../ui/Textarea';
import { Input } from '../../../ui/Input';

/**
 * BlockModal - Create/Edit block form
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} [props.block] - Existing block for edit (null for create)
 * @param {Object} props.dayBoundaries - Day start/end times { start, end }
 * @param {Array} props.existingBlocks - Other blocks for overlap validation
 * @param {Array} props.projects - Available projects
 * @param {Array} props.categories - Available categories
 * @param {function} props.onSave - Save handler
 * @param {function} props.onDelete - Delete handler (edit mode only)
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {Date} [props.defaultStartTime] - Default start time for new blocks
 */
export function BlockModal({
  open,
  onClose,
  block,
  dayBoundaries,
  existingBlocks = [],
  projects = [],
  categories = [],
  onSave,
  onDelete,
  isLoading = false,
  defaultStartTime
}) {
  // Form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!block;
  const maxDescriptionLength = 500;

  // Format date to time input value (HH:MM)
  const formatTimeForInput = useCallback((date) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // Parse time input to Date
  const parseTimeInput = useCallback((timeString, referenceDate) => {
    if (!timeString || !referenceDate) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(referenceDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }, []);

  // Initialize form when modal opens or block changes
  useEffect(() => {
    if (open) {
      if (block) {
        // Edit mode: populate from block
        setStartTime(formatTimeForInput(block.startTime));
        setEndTime(formatTimeForInput(block.endTime));
        setProjectId(block.projectId || '');
        setCategoryId(block.categoryId || '');
        setDescription(block.description || '');
      } else {
        // Create mode: use defaults
        const defaultStart = defaultStartTime || new Date();
        const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // +1 hour

        setStartTime(formatTimeForInput(defaultStart));
        setEndTime(formatTimeForInput(defaultEnd));
        setProjectId('');
        setCategoryId('');
        setDescription('');
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [open, block, defaultStartTime, formatTimeForInput]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    if (!startTime) {
      newErrors.startTime = 'Heure de debut requise';
    }
    if (!endTime) {
      newErrors.endTime = 'Heure de fin requise';
    }

    if (startTime && endTime && dayBoundaries) {
      const startDate = parseTimeInput(startTime, dayBoundaries.start);
      const endDate = parseTimeInput(endTime, dayBoundaries.start);

      if (!startDate || !endDate) {
        newErrors.time = 'Format de temps invalide';
      } else {
        // Check end > start
        if (endDate <= startDate) {
          newErrors.endTime = 'La fin doit etre apres le debut';
        }

        // Check within day boundaries
        if (startDate < dayBoundaries.start) {
          newErrors.startTime = 'Le debut ne peut pas etre avant le debut de la journee';
        }
        if (dayBoundaries.end && endDate > dayBoundaries.end) {
          newErrors.endTime = 'La fin ne peut pas etre apres la fin de la journee';
        }

        // Check for overlaps with existing blocks
        const hasOverlap = existingBlocks.some(existingBlock => {
          // Skip the current block in edit mode
          if (block && existingBlock.id === block.id) return false;

          const existingStart = new Date(existingBlock.startTime).getTime();
          const existingEnd = new Date(existingBlock.endTime).getTime();
          const newStart = startDate.getTime();
          const newEnd = endDate.getTime();

          return newStart < existingEnd && newEnd > existingStart;
        });

        if (hasOverlap) {
          newErrors.overlap = 'Ce bloc chevauche un bloc existant';
        }
      }
    }

    if (description.length > maxDescriptionLength) {
      newErrors.description = `Maximum ${maxDescriptionLength} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [startTime, endTime, dayBoundaries, existingBlocks, block, description, parseTimeInput]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const startDate = parseTimeInput(startTime, dayBoundaries.start);
    const endDate = parseTimeInput(endTime, dayBoundaries.start);

    const blockData = {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString()
    };

    if (projectId) blockData.projectId = projectId;
    if (categoryId) blockData.categoryId = categoryId;
    if (description) blockData.description = description.trim();

    onSave(blockData);
  }, [validate, startTime, endTime, projectId, categoryId, description, dayBoundaries, parseTimeInput, onSave]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(block.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [showDeleteConfirm, onDelete, block]);

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
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEditMode ? 'Modifier le bloc' : 'Nouveau bloc'}
      size="md"
    >
      <div className="space-y-4">
        {/* Time inputs row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="block-start-time" className="text-sm font-medium text-gray-700">
              Heure de debut
            </Label>
            <Input
              id="block-start-time"
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
            <Label htmlFor="block-end-time" className="text-sm font-medium text-gray-700">
              Heure de fin
            </Label>
            <Input
              id="block-end-time"
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

        {/* Overlap error */}
        {errors.overlap && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.overlap}</p>
          </div>
        )}

        {/* Project Selector */}
        <div className="space-y-2">
          <Label htmlFor="block-project" className="text-sm font-medium text-gray-700">
            Projet
            <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
          </Label>
          <Select
            id="block-project"
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
          <Label htmlFor="block-category" className="text-sm font-medium text-gray-700">
            Categorie
            <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
          </Label>
          <Select
            id="block-category"
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
            <Label htmlFor="block-description" className="text-sm font-medium text-gray-700">
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
            id="block-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Ajouter une description..."
            className="w-full min-h-[80px]"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          {/* Delete button (edit mode only) */}
          {isEditMode && (
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
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
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
          <div className={`flex items-center gap-2 ${!isEditMode ? 'ml-auto' : ''}`}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default BlockModal;
