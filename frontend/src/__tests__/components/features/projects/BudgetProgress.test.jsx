// frontend/src/__tests__/components/features/projects/BudgetProgress.test.jsx
// Story 3.7: Admin Management UI - Projects

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BudgetProgress } from '../../../../components/features/projects/BudgetProgress';

describe('BudgetProgress', () => {
  describe('when no budget is set', () => {
    it('displays "Pas de budget" text', () => {
      render(<BudgetProgress budgetHours={null} trackedHours={10} />);

      expect(screen.getByText('Pas de budget')).toBeInTheDocument();
    });

    it('displays "-" in compact mode', () => {
      render(<BudgetProgress budgetHours={null} trackedHours={10} compact />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('when budget is set', () => {
    it('displays budget information with tracked hours', () => {
      render(<BudgetProgress budgetHours={100} trackedHours={25} />);

      expect(screen.getByText(/Budget: 25h \/ 100h/)).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('displays percentage in compact mode', () => {
      render(<BudgetProgress budgetHours={100} trackedHours={50} compact />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows over-budget message when exceeded', () => {
      render(<BudgetProgress budgetHours={100} trackedHours={120} />);

      // Component displays with .toFixed(1) format: +20.0h
      expect(screen.getByText(/\+20\.0h/)).toBeInTheDocument();
      expect(screen.getByText(/Depassement de 20% du budget/)).toBeInTheDocument();
    });

    it('caps progress bar at 100%', () => {
      render(<BudgetProgress budgetHours={100} trackedHours={150} />);

      // The percentage displayed should be 100% (capped)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('color indicators', () => {
    it('shows green for low usage (< 75%)', () => {
      const { container } = render(<BudgetProgress budgetHours={100} trackedHours={50} />);

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows yellow for high usage (75-90%)', () => {
      const { container } = render(<BudgetProgress budgetHours={100} trackedHours={80} />);

      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows red for critical usage (>= 90%)', () => {
      const { container } = render(<BudgetProgress budgetHours={100} trackedHours={95} />);

      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
