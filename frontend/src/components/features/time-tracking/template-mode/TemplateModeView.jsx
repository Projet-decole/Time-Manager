// frontend/src/components/features/time-tracking/template-mode/TemplateModeView.jsx
// Story 4.10: Implement Template Mode UI - Main Template Mode Container

import { useState, useCallback, useEffect } from 'react';
import { useTemplates } from '../../../../hooks/useTemplates';
import { useTemplate } from '../../../../hooks/useTemplate';
import { useProjects } from '../../../../hooks/useProjects';
import { useCategories } from '../../../../hooks/useCategories';
import { useToast } from '../../../ui/Toast';
import { Button } from '../../../ui/Button';
import { EmptyTemplatesState } from './EmptyTemplatesState';
import { TemplatesList } from './TemplatesList';
import { TemplateDetailModal } from './TemplateDetailModal';
import { TemplateBuilderModal } from './TemplateBuilderModal';
import { ApplyTemplateModal } from './ApplyTemplateModal';

/**
 * TemplateModeView - Main container for Template Mode
 * Manages state and renders templates list, modals
 *
 * States:
 * - Loading: Shows skeleton
 * - No Templates: Shows EmptyTemplatesState
 * - Has Templates: Shows TemplatesList
 */
export function TemplateModeView() {
  const toast = useToast();

  // Templates list state
  const {
    templates,
    isLoading,
    error: listError,
    refresh: refreshTemplates,
    clearError: clearListError,
    hasTemplates
  } = useTemplates();

  // Single template operations
  const {
    isCreating,
    isUpdating,
    isDeleting,
    isApplying,
    isBusy,
    error: templateError,
    create: createTemplate,
    update: updateTemplate,
    remove: deleteTemplate,
    apply: applyTemplate,
    clearError: clearTemplateError
  } = useTemplate(refreshTemplates);

  // Projects and categories for form
  const { projects, loading: projectsLoading } = useProjects();
  const { categories, loading: categoriesLoading } = useCategories();

  // Modal states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [applyError, setApplyError] = useState(null);

  // Delete confirmation state
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle errors
  useEffect(() => {
    if (listError) {
      toast.error(listError);
      clearListError();
    }
  }, [listError, clearListError, toast]);

  useEffect(() => {
    if (templateError) {
      toast.error(templateError);
      clearTemplateError();
    }
  }, [templateError, clearTemplateError, toast]);

  /**
   * Open builder modal for creating new template
   */
  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null);
    setIsBuilderOpen(true);
  }, []);

  /**
   * Open detail modal for template
   */
  const handleTemplateClick = useCallback((template) => {
    setSelectedTemplate(template);
    setIsDetailOpen(true);
  }, []);

  /**
   * Open apply modal for template
   */
  const handleApplyClick = useCallback((template) => {
    setSelectedTemplate(template);
    setApplyError(null);
    setIsApplyOpen(true);
    setIsDetailOpen(false);
  }, []);

  /**
   * Open builder modal for editing template
   */
  const handleEditClick = useCallback((template) => {
    setEditingTemplate(template);
    setIsBuilderOpen(true);
    setIsDetailOpen(false);
  }, []);

  /**
   * Show delete confirmation
   */
  const handleDeleteClick = useCallback((template) => {
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
    setIsDetailOpen(false);
  }, []);

  /**
   * Confirm delete template
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete.id);
      toast.success('Template supprime');
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    } catch (err) {
      // Error handled by useEffect
      console.error('Delete template error:', err);
    }
  }, [templateToDelete, deleteTemplate, toast]);

  /**
   * Cancel delete confirmation
   */
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setTemplateToDelete(null);
  }, []);

  /**
   * Save template (create or update)
   */
  const handleSaveTemplate = useCallback(async (templateData) => {
    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplate(editingTemplate.id, templateData);
        toast.success('Template mis a jour');
      } else {
        // Create new template
        await createTemplate(templateData);
        toast.success('Template cree');
      }
      setIsBuilderOpen(false);
      setEditingTemplate(null);
    } catch (err) {
      // Error handled by useEffect
      console.error('Save template error:', err);
    }
  }, [editingTemplate, createTemplate, updateTemplate, toast]);

  /**
   * Apply template to date
   */
  const handleApplyTemplate = useCallback(async (date) => {
    if (!selectedTemplate) return;

    try {
      setApplyError(null);
      const result = await applyTemplate(selectedTemplate.id, date);

      // Check for warnings
      if (result?.meta?.warnings?.length > 0) {
        toast.warning('Template applique avec avertissements');
      } else {
        toast.success('Template applique - journee creee');
      }

      setIsApplyOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      // Handle specific error codes
      if (err.code === 'DATE_HAS_ENTRIES') {
        setApplyError('Cette date contient deja des entrees');
      } else if (err.code === 'TEMPLATE_EMPTY') {
        setApplyError('Le template ne contient aucun bloc');
      } else {
        setApplyError(err.message || 'Erreur lors de l\'application du template');
      }
    }
  }, [selectedTemplate, applyTemplate, toast]);

  /**
   * Close modals
   */
  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedTemplate(null);
  }, []);

  const handleCloseBuilder = useCallback(() => {
    setIsBuilderOpen(false);
    setEditingTemplate(null);
  }, []);

  const handleCloseApply = useCallback(() => {
    setIsApplyOpen(false);
    setApplyError(null);
  }, []);

  // Loading state
  if (isLoading || projectsLoading || categoriesLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // No templates state
  if (!hasTemplates) {
    return (
      <>
        <EmptyTemplatesState onCreateTemplate={handleCreateTemplate} />

        {/* Builder Modal */}
        <TemplateBuilderModal
          open={isBuilderOpen}
          onClose={handleCloseBuilder}
          template={editingTemplate}
          projects={projects}
          categories={categories}
          onSave={handleSaveTemplate}
          isLoading={isCreating || isUpdating}
        />
      </>
    );
  }

  // Templates list state
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Mes Templates
        </h2>
        <Button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2"
        >
          <PlusIcon />
          Nouveau Template
        </Button>
      </div>

      {/* Templates list */}
      <TemplatesList
        templates={templates}
        onTemplateClick={handleTemplateClick}
        onApply={handleApplyClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Detail Modal */}
      <TemplateDetailModal
        open={isDetailOpen}
        onClose={handleCloseDetail}
        template={selectedTemplate}
        onApply={handleApplyClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        isLoading={isBusy}
      />

      {/* Builder Modal */}
      <TemplateBuilderModal
        open={isBuilderOpen}
        onClose={handleCloseBuilder}
        template={editingTemplate}
        projects={projects}
        categories={categories}
        onSave={handleSaveTemplate}
        isLoading={isCreating || isUpdating}
      />

      {/* Apply Modal */}
      <ApplyTemplateModal
        open={isApplyOpen}
        onClose={handleCloseApply}
        template={selectedTemplate}
        onApply={handleApplyTemplate}
        isLoading={isApplying}
        error={applyError}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelDelete} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Supprimer ce template ?
            </h3>
            <p className="text-gray-600 mb-4">
              Etes-vous sur de vouloir supprimer "{templateToDelete.name}" ? Cette action est irreversible.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default TemplateModeView;
