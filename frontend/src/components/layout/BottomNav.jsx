// frontend/src/components/layout/BottomNav.jsx
// Story 4.4: Simple Mode UI - Mobile Bottom Navigation

import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * BottomNav - Mobile bottom navigation
 *
 * Design specs:
 * - Fixed position at bottom
 * - 3 items: Activite | Dashboard | Plus
 * - Icons + labels
 * - Touch targets >44px
 * - Height: 60-80px
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */
const BottomNav = forwardRef(({
  className = '',
  ...props
}, ref) => {
  const location = useLocation();

  const navItems = [
    {
      id: 'activite',
      label: 'Activite',
      path: '/time-tracking',
      icon: ClockIcon
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: ChartIcon
    },
    {
      id: 'plus',
      label: 'Plus',
      path: '/profile',
      icon: MenuIcon
    }
  ];

  return (
    <nav
      ref={ref}
      className={`
        fixed bottom-0 left-0 right-0
        bg-white border-t border-gray-200
        px-4 py-2
        sm:hidden
        z-40
        ${className}
      `.trim()}
      aria-label="Navigation principale"
      {...props}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/time-tracking' && location.pathname.startsWith('/time-tracking'));
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] min-h-[56px]
                px-3 py-2
                rounded-lg
                transition-colors duration-200
                touch-manipulation
                ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

/**
 * Clock icon for Activity
 */
function ClockIcon({ className = '' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Chart icon for Dashboard
 */
function ChartIcon({ className = '' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

/**
 * Menu icon for More
 */
function MenuIcon({ className = '' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

export { BottomNav };
export default BottomNav;
