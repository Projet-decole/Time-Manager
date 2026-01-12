// frontend/src/setupTests.js

import "@testing-library/jest-dom";

// =============================================================================
// Global Mocks for Recharts and ResponsiveContainer
// =============================================================================
// Recharts uses ResizeObserver and DOM dimension methods to calculate chart sizes.
// In JSDOM (test environment), these don't work properly, causing:
// - "The width(-1) and height(-1) of chart should be greater than 0" warnings
// - Potential re-render loops that can crash tests
//
// These mocks provide valid dimensions to prevent warnings and ensure stable tests.
// =============================================================================

// Mock ResizeObserver
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target) {
    // Immediately call callback with valid dimensions
    if (this.callback) {
      this.callback([
        {
          target,
          contentRect: {
            width: 500,
            height: 300,
            top: 0,
            left: 0,
            bottom: 300,
            right: 500,
            x: 0,
            y: 0
          },
          borderBoxSize: [{ inlineSize: 500, blockSize: 300 }],
          contentBoxSize: [{ inlineSize: 500, blockSize: 300 }]
        }
      ]);
    }
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

// Mock getBoundingClientRect for dimension calculations
const mockBoundingClientRect = () => ({
  width: 500,
  height: 300,
  top: 0,
  left: 0,
  bottom: 300,
  right: 500,
  x: 0,
  y: 0,
  toJSON: () => ({})
});

// Only set if not already defined (avoid conflicts)
if (!HTMLElement.prototype.getBoundingClientRect.__isMocked) {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function() {
    // Return valid dimensions for chart containers, fallback to original for others
    if (this.closest('[data-testid*="chart"]') ||
        this.classList.contains('recharts-responsive-container') ||
        this.closest('.recharts-responsive-container')) {
      return mockBoundingClientRect();
    }
    return originalGetBoundingClientRect.call(this);
  };
  HTMLElement.prototype.getBoundingClientRect.__isMocked = true;
}

// Mock offsetWidth/offsetHeight properties
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    // Return valid width for chart-related elements
    if (this.closest('[data-testid*="chart"]') ||
        this.classList.contains('recharts-responsive-container') ||
        this.closest('.recharts-responsive-container')) {
      return 500;
    }
    return 0;
  }
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    // Return valid height for chart-related elements
    if (this.closest('[data-testid*="chart"]') ||
        this.classList.contains('recharts-responsive-container') ||
        this.closest('.recharts-responsive-container')) {
      return 300;
    }
    return 0;
  }
});

// =============================================================================
// Suppress Recharts warnings in test output
// =============================================================================
// Filter out known Recharts dimension warnings to keep test output clean
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' &&
      message.includes('width') &&
      message.includes('height') &&
      message.includes('chart should be greater than 0')) {
    return; // Suppress Recharts dimension warnings
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' &&
      message.includes('width') &&
      message.includes('height') &&
      message.includes('chart should be greater than 0')) {
    return; // Suppress Recharts dimension warnings
  }
  originalConsoleError.apply(console, args);
};
