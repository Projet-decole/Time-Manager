// frontend/src/components/features/time-tracking/ModeSwitch.jsx
// Story 4.4: Simple Mode UI - Mode Switch Component

import { forwardRef } from 'react';

/**
 * ModeSwitch - Top navigation for time tracking modes
 *
 * Design specs:
 * - Tab-style or segmented control
 * - 3 options: Tache | Journee | Template
 * - Active state clearly indicated
 * - Story 4.4: Only "Tache" is functional, others show "Coming Soon"
 *
 * @param {Object} props
 * @param {string} [props.activeMode='tache'] - Current mode: 'tache' | 'journee' | 'template'
 * @param {function} props.onModeChange - Mode change callback
 * @param {string} [props.className] - Additional CSS classes
 */
const ModeSwitch = forwardRef(({
  activeMode = 'tache',
  onModeChange,
  className = '',
  ...props
}, ref) => {
  const modes = [
    { id: 'tache', label: 'Tache', available: true },
    { id: 'journee', label: 'Journee', available: true },
    { id: 'template', label: 'Template', available: true }
  ];

  const handleModeClick = (mode) => {
    if (mode.available && onModeChange) {
      onModeChange(mode.id);
    }
  };

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-lg ${className}`.trim()}
      role="tablist"
      aria-label="Mode de suivi du temps"
      {...props}
    >
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const isDisabled = !mode.available;

        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            onClick={() => handleModeClick(mode)}
            disabled={isDisabled}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-md
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              min-w-[100px] touch-manipulation
              ${isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            title={isDisabled ? 'Bientot disponible' : mode.label}
          >
            {mode.label}
            {isDisabled && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-gray-300 opacity-75" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

ModeSwitch.displayName = 'ModeSwitch';

export { ModeSwitch };
export default ModeSwitch;
