// frontend/src/components/features/time-tracking/day-mode/DayModeView.jsx
// Story 4.7: Day Mode UI with Timeline - Main Day Mode Container

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDayMode } from '../../../../hooks/useDayMode';
import { useDayBlocks } from '../../../../hooks/useDayBlocks';
import { useProjects } from '../../../../hooks/useProjects';
import { useCategories } from '../../../../hooks/useCategories';
import { useToast } from '../../../ui/Toast';
import { Button } from '../../../ui/Button';
import { StartDayButton } from './StartDayButton';
import { DayHeader } from './DayHeader';
import { DayTimeline } from './DayTimeline';
import { BlockModal } from './BlockModal';
import { DaySummaryModal } from './DaySummaryModal';
import { CompletedDaysList } from './CompletedDaysList';
import { SaveAsTemplateModal } from '../template-mode/SaveAsTemplateModal';
import { useTemplate } from '../../../../hooks/useTemplate';

/**
 * DayModeView - Main container for Day Mode
 * Manages state and renders appropriate view based on activeDay status
 *
 * States:
 * - Loading: Shows skeleton
 * - No Active Day: Shows StartDayButton + recent days
 * - Active Day: Shows timeline with blocks
 */
export function DayModeView() {
  const toast = useToast();

  // Day mode state
  const {
    activeDay,
    blocks,
    completedDays,
    isLoading,
    isStartingDay,
    isEndingDay,
    hasActiveDay,
    error: dayError,
    startDay,
    endDay,
    refreshBlocks,
    getDayStats,
    clearError: clearDayError
  } = useDayMode();

  // Block operations
  const {
    createBlock,
    updateBlock,
    deleteBlock,
    isCreating,
    isUpdating,
    isDeleting,
    error: blockError,
    clearError: clearBlockError
  } = useDayBlocks(refreshBlocks);

  // Projects and categories for form
  const { projects } = useProjects();
  const { categories } = useCategories();

  // Template operations (Story 4.10)
  const {
    isCreating: isCreatingTemplate,
    createFromDay,
    error: templateError,
    clearError: clearTemplateError
  } = useTemplate();

  // Modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [defaultStartTime, setDefaultStartTime] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [daySummary, setDaySummary] = useState(null);
  const [saveAsTemplateModalOpen, setSaveAsTemplateModalOpen] = useState(false);
  const [dayToSaveAsTemplate, setDayToSaveAsTemplate] = useState(null);

  // Handle errors
  useEffect(() => {
    if (dayError) {
      toast.error(dayError);
      clearDayError();
    }
  }, [dayError, clearDayError, toast]);

  useEffect(() => {
    if (blockError) {
      toast.error(blockError);
      clearBlockError();
    }
  }, [blockError, clearBlockError, toast]);

  useEffect(() => {
    if (templateError) {
      toast.error(templateError);
      clearTemplateError();
    }
  }, [templateError, clearTemplateError, toast]);

  // Get day statistics
  const dayStats = useMemo(() => {
    return getDayStats();
  }, [getDayStats]);

  // Day boundaries for validation
  const dayBoundaries = useMemo(() => {
    if (!activeDay) return null;
    return {
      start: new Date(activeDay.startTime),
      end: activeDay.endTime ? new Date(activeDay.endTime) : new Date()
    };
  }, [activeDay]);

  /**
   * Handle start day
   */
  const handleStartDay = useCallback(async () => {
    try {
      await startDay();
      toast.success('Journee demarree');
    } catch (err) {
      // Error handled by useEffect
      console.error('Start day error:', err);
    }
  }, [startDay, toast]);

  /**
   * Handle end day
   */
  const handleEndDay = useCallback(async () => {
    try {
      const summary = await endDay();
      setDaySummary(summary);
      setSummaryModalOpen(true);
      toast.success('Journee terminee');
    } catch (err) {
      // Error handled by useEffect
      console.error('End day error:', err);
    }
  }, [endDay, toast]);

  /**
   * Handle block click (edit)
   */
  const handleBlockClick = useCallback((block) => {
    setSelectedBlock(block);
    setDefaultStartTime(null);
    setBlockModalOpen(true);
  }, []);

  /**
   * Handle gap click (create new block at time)
   */
  const handleGapClick = useCallback((clickTime) => {
    setSelectedBlock(null);
    setDefaultStartTime(clickTime);
    setBlockModalOpen(true);
  }, []);

  /**
   * Handle block save (create or update)
   */
  const handleBlockSave = useCallback(async (blockData) => {
    try {
      if (selectedBlock) {
        // Update existing block
        await updateBlock(selectedBlock.id, blockData);
        toast.success('Bloc modifie');
      } else {
        // Create new block
        await createBlock(blockData);
        toast.success('Bloc cree');
      }
      setBlockModalOpen(false);
      setSelectedBlock(null);
      setDefaultStartTime(null);
    } catch (err) {
      // Error handled by useEffect
      console.error('Block save error:', err);
    }
  }, [selectedBlock, createBlock, updateBlock, toast]);

  /**
   * Handle block delete
   */
  const handleBlockDelete = useCallback(async (blockId) => {
    try {
      await deleteBlock(blockId);
      toast.success('Bloc supprime');
      setBlockModalOpen(false);
      setSelectedBlock(null);
    } catch (err) {
      // Error handled by useEffect
      console.error('Block delete error:', err);
    }
  }, [deleteBlock, toast]);

  /**
   * Handle block drag (move)
   */
  const handleBlockMove = useCallback(async (blockId) => {
    // TODO: Implement drag-to-move functionality
    // For now, open edit modal instead
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      handleBlockClick(block);
    }
  }, [blocks, handleBlockClick]);

  /**
   * Handle block resize
   */
  const handleBlockResize = useCallback(async (blockId) => {
    // TODO: Implement resize functionality
    // For now, open edit modal instead
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      handleBlockClick(block);
    }
  }, [blocks, handleBlockClick]);

  /**
   * Close block modal
   */
  const handleCloseBlockModal = useCallback(() => {
    setBlockModalOpen(false);
    setSelectedBlock(null);
    setDefaultStartTime(null);
  }, []);

  /**
   * Close summary modal
   */
  const handleCloseSummaryModal = useCallback(() => {
    setSummaryModalOpen(false);
    setDaySummary(null);
  }, []);

  /**
   * Open save as template modal (Story 4.10)
   */
  const handleSaveAsTemplate = useCallback((day) => {
    setDayToSaveAsTemplate(day);
    setSaveAsTemplateModalOpen(true);
    setSummaryModalOpen(false);
  }, []);

  /**
   * Close save as template modal
   */
  const handleCloseSaveAsTemplateModal = useCallback(() => {
    setSaveAsTemplateModalOpen(false);
    setDayToSaveAsTemplate(null);
  }, []);

  /**
   * Handle completed day click (AC12: View History)
   * Shows the day summary in read-only mode
   */
  const handleCompletedDayClick = useCallback((day) => {
    setDaySummary(day);
    setSummaryModalOpen(true);
  }, []);

  /**
   * Save day as template (Story 4.10)
   */
  const handleConfirmSaveAsTemplate = useCallback(async (data) => {
    if (!dayToSaveAsTemplate) return;

    try {
      await createFromDay(dayToSaveAsTemplate.id, data);
      toast.success('Template cree depuis la journee');
      setSaveAsTemplateModalOpen(false);
      setDayToSaveAsTemplate(null);
    } catch (err) {
      // Error handled by useEffect
      console.error('Save as template error:', err);
    }
  }, [dayToSaveAsTemplate, createFromDay, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // No active day state
  if (!hasActiveDay) {
    return (
      <div className="space-y-6">
        {/* Empty state illustration */}
        <div className="text-center py-8">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune journee en cours
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Demarrez votre journee pour commencer a suivre votre temps
          </p>

          {/* Start Day Button */}
          <div className="flex justify-center">
            <StartDayButton
              isLoading={isStartingDay}
              onClick={handleStartDay}
            />
          </div>
        </div>

        {/* Recent completed days (AC12: View History) */}
        <CompletedDaysList
          days={completedDays}
          loading={false}
          onDayClick={handleCompletedDayClick}
        />
      </div>
    );
  }

  // Active day state
  return (
    <div className="space-y-4">
      {/* Day Header */}
      <DayHeader
        day={activeDay}
        stats={dayStats}
      />

      {/* Timeline */}
      <DayTimeline
        day={activeDay}
        blocks={blocks}
        onBlockClick={handleBlockClick}
        onGapClick={handleGapClick}
        onBlockMove={handleBlockMove}
        onBlockResize={handleBlockResize}
      />

      {/* End Day Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleEndDay}
          disabled={isEndingDay}
          className="bg-orange-500 hover:bg-orange-600 text-white min-w-[200px] h-12"
        >
          {isEndingDay ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Finalisation...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                />
              </svg>
              Terminer la journee
            </span>
          )}
        </Button>
      </div>

      {/* Block Modal */}
      <BlockModal
        open={blockModalOpen}
        onClose={handleCloseBlockModal}
        block={selectedBlock}
        dayBoundaries={dayBoundaries}
        existingBlocks={blocks}
        projects={projects}
        categories={categories}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        isLoading={isCreating || isUpdating || isDeleting}
        defaultStartTime={defaultStartTime}
      />

      {/* Summary Modal */}
      <DaySummaryModal
        open={summaryModalOpen}
        onClose={handleCloseSummaryModal}
        summary={daySummary}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      {/* Save as Template Modal (Story 4.10) */}
      <SaveAsTemplateModal
        open={saveAsTemplateModalOpen}
        onClose={handleCloseSaveAsTemplateModal}
        day={dayToSaveAsTemplate}
        onSave={handleConfirmSaveAsTemplate}
        isLoading={isCreatingTemplate}
      />
    </div>
  );
}

export default DayModeView;
