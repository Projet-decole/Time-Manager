// frontend/src/components/features/time-tracking/day-mode/TimelineBlock.jsx
// Story 4.7: Day Mode UI with Timeline - Timeline Block Component

import { forwardRef, useMemo, useState, useRef, useEffect } from 'react';
import { Badge } from '../../../ui/Badge';

/**
 * TimelineBlock - Draggable/resizable block on timeline
 *
 * @param {Object} props
 * @param {Object} props.block - Block data
 * @param {number} [props.position] - CSS left position percentage (desktop)
 * @param {number} [props.width] - CSS width percentage (desktop)
 * @param {function} props.onClick - Click to edit handler
 * @param {function} [props.onDragEnd] - Drag end callback (desktop)
 * @param {function} [props.onResizeEnd] - Resize end callback (desktop)
 * @param {boolean} [props.isDraggable=true] - Enable drag (desktop only)
 * @param {boolean} [props.isResizable=true] - Enable resize (desktop only)
 * @param {boolean} [props.isCompact=false] - Compact mode for mobile cards
 * @param {string} [props.className] - Additional CSS classes
 */
const TimelineBlock = forwardRef(({
  block,
  position = 0,
  width = 10,
  onClick,
  onDragEnd,
  onResizeEnd,
  isDraggable = true,
  isResizable = true,
  isCompact = false,
  className = '',
  ...props
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const blockRef = useRef(null);
  const dragStartRef = useRef({ x: 0, position: 0 });
  const resizeStartRef = useRef({ x: 0, width: 0, edge: null });

  // Format time
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  // Get display values
  const displayValues = useMemo(() => {
    const startTime = formatTime(block.startTime);
    const endTime = formatTime(block.endTime);
    const duration = formatDuration(block.durationMinutes);
    const projectName = block.project?.name || block.project?.code || 'Sans projet';
    const categoryName = block.category?.name || null;
    const categoryColor = block.category?.color || '#6B7280';

    return {
      startTime,
      endTime,
      duration,
      projectName,
      categoryName,
      categoryColor
    };
  }, [block]);

  // Handle click
  const handleClick = (e) => {
    if (isDragging || isResizing) return;
    e.stopPropagation();
    if (onClick) onClick(block);
  };

  // Handle drag start (desktop)
  const handleDragStart = (e) => {
    if (!isDraggable || isCompact) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      position: position
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragStop);
  };

  // Handle drag move
  const handleDragMove = () => {
    if (!isDragging) return;
    // Visual feedback handled via CSS transform during drag
  };

  // Handle drag stop
  const handleDragStop = (e) => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragStop);

    if (onDragEnd) {
      const deltaX = e.clientX - dragStartRef.current.x;
      // Convert pixel delta to time delta (would need timeline width)
      onDragEnd(block.id, deltaX);
    }
  };

  // Handle resize start (desktop)
  const handleResizeStart = (e, edge) => {
    if (!isResizable || isCompact) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      width: width,
      edge: edge
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeStop);
  };

  // Handle resize move
  const handleResizeMove = () => {
    if (!isResizing) return;
    // Visual feedback handled via CSS during resize
  };

  // Handle resize stop
  const handleResizeStop = (e) => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeStop);

    if (onResizeEnd) {
      const deltaX = e.clientX - resizeStartRef.current.x;
      onResizeEnd(block.id, resizeStartRef.current.edge, deltaX);
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragStop);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compact mode (mobile card view)
  if (isCompact) {
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={`
          bg-white rounded-lg border border-gray-200 p-4
          cursor-pointer hover:border-blue-300 hover:shadow-sm
          transition-all duration-200 touch-manipulation
          min-h-[60px]
          ${className}
        `.trim()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
        {...props}
      >
        {/* Time and Duration Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">
            {displayValues.startTime} - {displayValues.endTime}
          </span>
          <span className="text-sm text-gray-500">
            ({displayValues.duration})
          </span>
        </div>

        {/* Project Name */}
        <div className="text-sm text-gray-700 mb-2">
          {displayValues.projectName}
        </div>

        {/* Category Badge */}
        {displayValues.categoryName && (
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: `${displayValues.categoryColor}20`,
              color: displayValues.categoryColor,
              borderColor: displayValues.categoryColor
            }}
          >
            <span
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: displayValues.categoryColor }}
            />
            {displayValues.categoryName}
          </Badge>
        )}

        {/* Description Preview */}
        {block.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {block.description}
          </p>
        )}
      </div>
    );
  }

  // Desktop timeline block view
  return (
    <div
      ref={ref || blockRef}
      onClick={handleClick}
      onMouseDown={handleDragStart}
      className={`
        absolute top-0 h-full
        bg-white rounded-md border-2
        cursor-pointer
        transition-all duration-100
        hover:shadow-md hover:z-10
        ${isDragging ? 'opacity-75 shadow-lg z-20' : ''}
        ${isResizing ? 'z-20' : ''}
        group
        ${className}
      `.trim()}
      style={{
        left: `${position}%`,
        width: `${width}%`,
        borderColor: displayValues.categoryColor,
        backgroundColor: `${displayValues.categoryColor}10`,
        minWidth: '40px'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
      {...props}
    >
      {/* Content */}
      <div className="absolute inset-0 px-2 py-1 overflow-hidden flex flex-col justify-center">
        {/* Project/Time info */}
        <div className="text-xs font-medium text-gray-900 truncate">
          {displayValues.projectName}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {displayValues.startTime} - {displayValues.endTime}
        </div>
        {width > 8 && displayValues.categoryName && (
          <div
            className="text-xs truncate mt-0.5"
            style={{ color: displayValues.categoryColor }}
          >
            {displayValues.categoryName}
          </div>
        )}
      </div>

      {/* Left resize handle */}
      {isResizable && !isCompact && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-gray-400 rounded-l-md transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'start')}
        />
      )}

      {/* Right resize handle */}
      {isResizable && !isCompact && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-gray-400 rounded-r-md transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'end')}
        />
      )}
    </div>
  );
});

TimelineBlock.displayName = 'TimelineBlock';

export { TimelineBlock };
export default TimelineBlock;
