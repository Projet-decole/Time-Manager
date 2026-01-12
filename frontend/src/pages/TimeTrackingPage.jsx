// frontend/src/pages/TimeTrackingPage.jsx
// Story 4.4: Simple Mode UI - Main Time Tracking Page
// Story 4.7: Day Mode UI with Timeline
// Story 4.11: Added Edit/Delete for time entries

import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useProjects } from '../hooks/useProjects';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { timeEntriesService } from '../services/timeEntriesService';
import {
  TimerButton,
  TimerDisplay,
  TimerForm,
  TimeEntriesList,
  ModeSwitch
} from '../components/features/time-tracking';
import { DayModeView } from '../components/features/time-tracking/day-mode';
import { TemplateModeView } from '../components/features/time-tracking/template-mode';
import { BottomNav } from '../components/layout/BottomNav';

/**
 * TimeTrackingPage - Main page for time tracking (Simple Mode)
 *
 * Features:
 * - Timer with start/stop functionality
 * - Real-time elapsed time display
 * - Optional project/category/description selection
 * - Recent time entries history grouped by date
 * - Mobile-first responsive layout
 * - Toast notifications for feedback
 */
export default function TimeTrackingPage() {
  const toast = useToast();

  // Timer state and actions
  const {
    activeTimer,
    formattedTime,
    isLoading: timerLoading,
    isStarting,
    isStopping,
    isRunning,
    error: timerError,
    startTimer,
    stopTimer,
    clearError: clearTimerError,
    syncWithBackend
  } = useTimer();

  // Time entries for history
  const {
    groupedEntries,
    loading: entriesLoading,
    error: entriesError,
    refresh: refreshEntries
  } = useTimeEntries({ limit: 20 });

  // Projects and categories for form
  const { projects, loading: projectsLoading } = useProjects();
  const { categories, loading: categoriesLoading } = useCategories();

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Mode state (only 'tache' is functional for now)
  const [activeMode, setActiveMode] = useState('tache');

  // Story 4.11: Edit/Delete modal states
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editProjectId, setEditProjectId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Sync form state with active timer on load
  useEffect(() => {
    if (activeTimer) {
      setSelectedProjectId(activeTimer.projectId || '');
      setSelectedCategoryId(activeTimer.categoryId || '');
      setDescription(activeTimer.description || '');
    }
  }, [activeTimer]);

  // Handle timer errors
  useEffect(() => {
    if (timerError) {
      // If timer already running error, sync with backend
      if (timerError.includes('already running') || timerError.includes('TIMER_ALREADY_RUNNING')) {
        syncWithBackend();
        toast.info('Timer deja en cours - synchronisation effectuee');
      } else {
        toast.error(timerError);
      }
      clearTimerError();
    }
  }, [timerError, clearTimerError, syncWithBackend, toast]);

  /**
   * Handle start timer
   */
  const handleStartTimer = useCallback(async () => {
    try {
      const options = {};
      if (selectedProjectId) options.projectId = selectedProjectId;
      if (selectedCategoryId) options.categoryId = selectedCategoryId;
      if (description) options.description = description;

      await startTimer(options);
      toast.success('Timer demarre');
    } catch (err) {
      // Error handled by useEffect above
      console.error('Start timer error:', err);
    }
  }, [startTimer, selectedProjectId, selectedCategoryId, description, toast]);

  /**
   * Handle stop timer
   */
  const handleStopTimer = useCallback(async () => {
    try {
      const options = {};
      if (selectedProjectId) options.projectId = selectedProjectId;
      if (selectedCategoryId) options.categoryId = selectedCategoryId;
      if (description !== undefined) options.description = description;

      await stopTimer(options);
      toast.success('Entree de temps enregistree');

      // Reset form
      setSelectedProjectId('');
      setSelectedCategoryId('');
      setDescription('');

      // Refresh entries list
      refreshEntries();
    } catch (err) {
      // Error handled by useEffect above
      console.error('Stop timer error:', err);
    }
  }, [stopTimer, selectedProjectId, selectedCategoryId, description, toast, refreshEntries]);

  /**
   * Handle timer button click
   */
  const handleTimerClick = useCallback(() => {
    if (isRunning) {
      handleStopTimer();
    } else {
      handleStartTimer();
    }
  }, [isRunning, handleStartTimer, handleStopTimer]);

  /**
   * Handle mode change
   * Story 4.7: Now supports 'tache' and 'journee' modes
   * Story 4.10: Now supports 'template' mode
   */
  const handleModeChange = useCallback((mode) => {
    if (mode === 'tache' || mode === 'journee' || mode === 'template') {
      setActiveMode(mode);
    } else {
      toast.info('Ce mode sera bientot disponible');
    }
  }, [toast]);

  // ===========================================
  // Story 4.11: Edit/Delete handlers
  // ===========================================

  /**
   * Format ISO datetime to local input value
   */
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  /**
   * Handle edit entry - open modal with entry data
   */
  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setEditProjectId(entry.projectId || '');
    setEditCategoryId(entry.categoryId || '');
    setEditDescription(entry.description || '');
    setEditStartTime(formatDateTimeLocal(entry.startTime));
    setEditEndTime(formatDateTimeLocal(entry.endTime));
    setShowEditModal(true);
  }, []);

  /**
   * Handle save edit
   */
  const handleSaveEdit = useCallback(async () => {
    if (!editingEntry) return;

    try {
      setIsSaving(true);
      const updateData = {
        projectId: editProjectId || null,
        categoryId: editCategoryId || null,
        description: editDescription || null,
        startTime: editStartTime ? new Date(editStartTime).toISOString() : undefined,
        endTime: editEndTime ? new Date(editEndTime).toISOString() : undefined
      };

      await timeEntriesService.update(editingEntry.id, updateData);
      toast.success('Entree modifiee');
      setShowEditModal(false);
      setEditingEntry(null);
      refreshEntries();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  }, [editingEntry, editProjectId, editCategoryId, editDescription, editStartTime, editEndTime, toast, refreshEntries]);

  /**
   * Handle delete entry - show confirmation
   */
  const handleDeleteEntry = useCallback((entry) => {
    setDeletingEntry(entry);
    setShowDeleteConfirm(true);
  }, []);

  /**
   * Confirm delete
   */
  const confirmDelete = useCallback(async () => {
    if (!deletingEntry) return;

    try {
      setIsDeleting(true);
      await timeEntriesService.delete(deletingEntry.id);
      toast.success('Entree supprimee');
      setShowDeleteConfirm(false);
      setDeletingEntry(null);
      refreshEntries();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }, [deletingEntry, toast, refreshEntries]);

  /**
   * Cancel delete
   */
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeletingEntry(null);
  }, []);

  /**
   * Close edit modal
   */
  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingEntry(null);
  }, []);

  // Loading state for initial page load
  const isInitialLoading = timerLoading || projectsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Mode Switch */}
        <div className="mb-6">
          <ModeSwitch
            activeMode={activeMode}
            onModeChange={handleModeChange}
          />
        </div>

        {/* Conditionally render based on active mode */}
        {activeMode === 'tache' && (
          <>
            {/* Timer Section (Simple Mode) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              {/* Timer Display */}
              <div className="text-center mb-6">
                <TimerDisplay
                  time={formattedTime}
                  isRunning={isRunning}
                />
              </div>

              {/* Timer Button */}
              <div className="flex justify-center mb-6">
                <TimerButton
                  isRunning={isRunning}
                  isLoading={isStarting || isStopping || isInitialLoading}
                  onClick={handleTimerClick}
                />
              </div>

              {/* Timer Form */}
              <TimerForm
                projectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
                projects={projects}
                categoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                categories={categories}
                description={description}
                onDescriptionChange={setDescription}
                disabled={isInitialLoading}
              />
            </div>

            {/* Recent Entries Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Historique recent
              </h2>
              <TimeEntriesList
                groupedEntries={groupedEntries}
                loading={entriesLoading}
                error={entriesError}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </div>
          </>
        )}

        {/* Day Mode (Story 4.7) */}
        {activeMode === 'journee' && (
          <DayModeView />
        )}

        {/* Template Mode (Story 4.10) */}
        {activeMode === 'template' && (
          <TemplateModeView />
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />

      {/* Story 4.11: Edit Entry Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title="Modifier l'entree"
        size="md"
      >
        <div className="space-y-4">
          {/* Project Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projet
            </label>
            <select
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sans projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie
            </label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sans categorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debut
            </label>
            <input
              type="datetime-local"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fin
            </label>
            <input
              type="datetime-local"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Description optionnelle..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Story 4.11: Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Etes-vous sur de vouloir supprimer cette entree de temps ?
            Cette action est irreversible.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={cancelDelete}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
