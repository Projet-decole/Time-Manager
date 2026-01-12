// frontend/src/components/ui/Toast.jsx
// Story 4.4: Simple Mode UI - Toast Notification Component
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Toast context for managing notifications
 */
const ToastContext = createContext(null);

/**
 * Toast types and their styles
 */
const toastStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white'
};

/**
 * Toast icons
 */
const toastIcons = {
  success: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

/**
 * Individual Toast component
 */
function ToastItem({ id, type, message, onClose }) {
  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toastStyles[type]} animate-slide-in`}
      role="alert"
    >
      {toastIcons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Fermer"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast container component
 */
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 sm:bottom-4 sm:right-4 sm:left-auto sm:transform-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

/**
 * Toast Provider component
 * Wrap your app with this to enable toast notifications
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message) => addToast('success', message), [addToast]);
  const error = useCallback((message) => addToast('error', message), [addToast]);
  const info = useCallback((message) => addToast('info', message), [addToast]);
  const warning = useCallback((message) => addToast('warning', message), [addToast]);

  const toast = { success, error, info, warning };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 * @returns {Object} Toast methods { success, error, info, warning }
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Add CSS animation to global styles via inline style tag
if (typeof document !== 'undefined') {
  const styleId = 'toast-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slide-in {
        animation: slide-in 0.2s ease-out;
      }
    `;
    document.head.appendChild(style);
  }
}

// Named exports only - ToastProvider and useToast are already exported above
