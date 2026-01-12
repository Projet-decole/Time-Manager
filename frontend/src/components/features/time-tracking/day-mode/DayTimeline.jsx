// frontend/src/components/features/time-tracking/day-mode/DayTimeline.jsx
// Story 4.7: Day Mode UI with Timeline - Timeline Visualization

import { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { TimelineBlock } from './TimelineBlock';

/**
 * DayTimeline - Visual timeline with time scale and blocks
 *
 * @param {Object} props
 * @param {Object} props.day - Active day data with startTime
 * @param {Array} props.blocks - Array of time blocks
 * @param {function} props.onBlockClick - Click handler for blocks
 * @param {function} props.onGapClick - Click handler for empty gaps
 * @param {function} [props.onBlockMove] - Drag handler (desktop only)
 * @param {function} [props.onBlockResize] - Resize handler (desktop only)
 * @param {string} [props.className] - Additional CSS classes
 */
const DayTimeline = forwardRef(({
  day,
  blocks = [],
  onBlockClick,
  onGapClick,
  onBlockMove,
  onBlockResize,
  className = '',
  ...props
}, ref) => {
  const [isMobile, setIsMobile] = useState(false);
  const timelineRef = useRef(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate timeline boundaries
  const timelineBounds = useMemo(() => {
    if (!day?.startTime) return null;

    const startTime = new Date(day.startTime);
    const endTime = day.endTime ? new Date(day.endTime) : new Date();

    // Round start to previous hour
    const startHour = new Date(startTime);
    startHour.setMinutes(0, 0, 0);

    // Round end to next hour
    const endHour = new Date(endTime);
    if (endHour.getMinutes() > 0) {
      endHour.setHours(endHour.getHours() + 1);
    }
    endHour.setMinutes(0, 0, 0);

    const totalDuration = endHour.getTime() - startHour.getTime();
    const hoursCount = Math.ceil(totalDuration / (1000 * 60 * 60));

    return {
      start: startHour,
      end: endHour,
      dayStart: startTime,
      dayEnd: endTime,
      totalDuration,
      hoursCount
    };
  }, [day]);

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    if (!timelineBounds) return [];

    const markers = [];
    const current = new Date(timelineBounds.start);

    while (current <= timelineBounds.end) {
      const position = ((current.getTime() - timelineBounds.start.getTime()) / timelineBounds.totalDuration) * 100;
      markers.push({
        time: current.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        position,
        hour: current.getHours()
      });
      current.setHours(current.getHours() + 1);
    }

    return markers;
  }, [timelineBounds]);

  // Calculate block positions
  const positionedBlocks = useMemo(() => {
    if (!timelineBounds || !blocks.length) return [];

    return blocks.map(block => {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);

      const position = ((blockStart.getTime() - timelineBounds.start.getTime()) / timelineBounds.totalDuration) * 100;
      const width = ((blockEnd.getTime() - blockStart.getTime()) / timelineBounds.totalDuration) * 100;

      return {
        ...block,
        position: Math.max(0, position),
        width: Math.min(100 - position, width)
      };
    });
  }, [timelineBounds, blocks]);

  // Handle gap click (calculate time from click position)
  const handleTimelineClick = (e) => {
    if (!onGapClick || !timelineRef.current || isMobile) return;

    // Check if clicking on a block
    if (e.target.closest('[data-block]')) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercentage = clickX / rect.width;

    // Calculate time from click position
    const clickTime = new Date(
      timelineBounds.start.getTime() +
      (clickPercentage * timelineBounds.totalDuration)
    );

    // Round to nearest 15 minutes
    const minutes = clickTime.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    clickTime.setMinutes(roundedMinutes, 0, 0);

    onGapClick(clickTime);
  };

  // Handle add block button for mobile
  const handleAddBlockClick = () => {
    if (!onGapClick) return;

    // Default to current time (rounded to 15 min)
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);

    onGapClick(now);
  };

  if (!day || !timelineBounds) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center text-gray-500 ${className}`}>
        Aucune journee active
      </div>
    );
  }

  // Mobile view: Cards list
  if (isMobile) {
    return (
      <div ref={ref} className={`space-y-3 ${className}`} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Blocs de temps ({blocks.length})
          </h3>
        </div>

        {/* Blocks as cards */}
        {positionedBlocks.length > 0 ? (
          <div className="space-y-2">
            {positionedBlocks
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
              .map(block => (
                <TimelineBlock
                  key={block.id}
                  block={block}
                  isCompact={true}
                  onClick={onBlockClick}
                  data-block="true"
                />
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
            Aucun bloc de temps.
            <br />
            Cliquez sur le bouton ci-dessous pour en ajouter un.
          </div>
        )}

        {/* Add block button for mobile */}
        <button
          type="button"
          onClick={handleAddBlockClick}
          className="w-full py-3 px-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-medium hover:bg-blue-100 transition-colors touch-manipulation min-h-[48px]"
        >
          + Ajouter un bloc
        </button>
      </div>
    );
  }

  // Desktop view: Horizontal timeline
  return (
    <div ref={ref} className={`${className}`} {...props}>
      {/* Timeline container */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Hour scale */}
        <div className="relative h-6 mb-2 border-b border-gray-200">
          {hourMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 text-xs text-gray-500"
              style={{ left: `${marker.position}%` }}
            >
              {marker.time}
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div
          ref={timelineRef}
          className="relative h-16 bg-gray-50 rounded cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Hour grid lines */}
          {hourMarkers.map((marker, index) => (
            <div
              key={`line-${index}`}
              className="absolute top-0 bottom-0 w-px bg-gray-200"
              style={{ left: `${marker.position}%` }}
            />
          ))}

          {/* Day boundaries indicator */}
          <div
            className="absolute top-0 bottom-0 bg-green-50 border-l-2 border-r-2 border-green-200"
            style={{
              left: `${((timelineBounds.dayStart.getTime() - timelineBounds.start.getTime()) / timelineBounds.totalDuration) * 100}%`,
              right: `${100 - ((timelineBounds.dayEnd.getTime() - timelineBounds.start.getTime()) / timelineBounds.totalDuration) * 100}%`
            }}
          />

          {/* Time blocks */}
          {positionedBlocks.map(block => (
            <TimelineBlock
              key={block.id}
              block={block}
              position={block.position}
              width={block.width}
              onClick={onBlockClick}
              onDragEnd={onBlockMove}
              onResizeEnd={onBlockResize}
              data-block="true"
            />
          ))}

          {/* Empty state message */}
          {positionedBlocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
              Cliquez pour ajouter un bloc de temps
            </div>
          )}
        </div>

        {/* Legend / Help text */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>Cliquez sur la timeline pour ajouter un bloc</span>
          <span>Glissez les bords pour redimensionner</span>
        </div>
      </div>

      {/* Quick add button (desktop) */}
      <button
        type="button"
        onClick={handleAddBlockClick}
        className="mt-3 w-full py-2 px-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-medium hover:bg-blue-100 transition-colors"
      >
        + Ajouter un bloc
      </button>
    </div>
  );
});

DayTimeline.displayName = 'DayTimeline';

export { DayTimeline };
export default DayTimeline;
