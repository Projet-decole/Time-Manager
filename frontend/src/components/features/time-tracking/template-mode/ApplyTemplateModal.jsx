// frontend/src/components/features/time-tracking/template-mode/ApplyTemplateModal.jsx
// Story 4.10: Implement Template Mode UI - Apply Template Modal Component

import { useState, useCallback, useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';

/**
 * ApplyTemplateModal - Apply template with date selection
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} props.template - Template to apply
 * @param {function} props.onApply - Apply handler (receives date string YYYY-MM-DD)
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.error] - Error message to display
 */
export function ApplyTemplateModal({
  open,
  onClose,
  template,
  onApply,
  isLoading = false,
  error
}) {
  const [selectedDate, setSelectedDate] = useState('');

  // Get today's date formatted as YYYY-MM-DD
  const todayFormatted = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Get date bounds (today to 1 year from now)
  const dateBounds = useMemo(() => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return {
      min: today.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }, []);

  // Calculate template stats
  const stats = useMemo(() => {
    if (!template || !template.entries) {
      return { blocksCount: 0, formattedDuration: '0h' };
    }

    const blocksCount = template.entries.length;
    const totalMinutes = template.entries.reduce((total, entry) => {
      if (!entry.startTime || !entry.endTime) return total;
      const [startH, startM] = entry.startTime.split(':').map(Number);
      const [endH, endM] = entry.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return total + Math.max(0, endMinutes - startMinutes);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    let formattedDuration = '0h';
    if (hours === 0 && mins > 0) formattedDuration = `${mins}m`;
    else if (mins === 0) formattedDuration = `${hours}h`;
    else formattedDuration = `${hours}h ${mins}m`;

    return { blocksCount, formattedDuration };
  }, [template]);

  // Handle apply today
  const handleApplyToday = useCallback(() => {
    onApply(todayFormatted);
  }, [todayFormatted, onApply]);

  // Handle apply to selected date
  const handleApplyToDate = useCallback(() => {
    if (selectedDate) {
      onApply(selectedDate);
    }
  }, [selectedDate, onApply]);

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!template) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Appliquer le template"
      size="md"
    >
      <div className="space-y-4">
        {/* Template preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
          {template.description && (
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{stats.blocksCount} bloc{stats.blocksCount !== 1 ? 's' : ''}</span>
            <span>{stats.formattedDuration} total</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Quick apply today */}
        <div className="border-b border-gray-200 pb-4">
          <Button
            onClick={handleApplyToday}
            disabled={isLoading}
            className="w-full h-12 text-base"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Application en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TodayIcon />
                Appliquer aujourd'hui
              </span>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            {formatDateForDisplay(todayFormatted)}
          </p>
        </div>

        {/* Custom date selection */}
        <div className="space-y-3">
          <Label htmlFor="apply-date" className="text-sm font-medium text-gray-700">
            Ou choisir une autre date
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="apply-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={dateBounds.min}
              max={dateBounds.max}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleApplyToDate}
              disabled={isLoading || !selectedDate}
              variant="outline"
            >
              Appliquer
            </Button>
          </div>
          {selectedDate && (
            <p className="text-xs text-gray-500">
              {formatDateForDisplay(selectedDate)}
            </p>
          )}
        </div>

        {/* Cancel button */}
        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Icons
function TodayIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default ApplyTemplateModal;
