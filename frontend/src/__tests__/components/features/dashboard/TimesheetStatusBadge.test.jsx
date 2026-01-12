// frontend/src/__tests__/components/features/dashboard/TimesheetStatusBadge.test.jsx
// Story 6.3: Employee Dashboard KPIs Section - TimesheetStatusBadge Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimesheetStatusBadge } from '../../../../components/features/dashboard/TimesheetStatusBadge';

describe('TimesheetStatusBadge', () => {
  describe('Status Display', () => {
    it('displays "Brouillon" for draft status', () => {
      render(<TimesheetStatusBadge status="draft" />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Brouillon');
    });

    it('displays "Soumis" for submitted status', () => {
      render(<TimesheetStatusBadge status="submitted" />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Soumis');
    });

    it('displays "Valide" for validated status', () => {
      render(<TimesheetStatusBadge status="validated" />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Valide');
    });

    it('displays "Rejete" for rejected status', () => {
      render(<TimesheetStatusBadge status="rejected" />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Rejete');
    });

    it('defaults to draft for unknown status', () => {
      render(<TimesheetStatusBadge status="unknown" />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Brouillon');
    });
  });

  describe('Status Colors', () => {
    it('has gray styling for draft status', () => {
      render(<TimesheetStatusBadge status="draft" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-800');
    });

    it('has blue styling for submitted status', () => {
      render(<TimesheetStatusBadge status="submitted" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-800');
    });

    it('has green styling for validated status', () => {
      render(<TimesheetStatusBadge status="validated" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
    });

    it('has red styling for rejected status', () => {
      render(<TimesheetStatusBadge status="rejected" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
    });
  });

  describe('Size Variants', () => {
    it('applies small size classes', () => {
      render(<TimesheetStatusBadge status="draft" size="sm" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('text-xs');
    });

    it('applies medium size classes by default', () => {
      render(<TimesheetStatusBadge status="draft" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('text-sm');
    });

    it('applies large size classes', () => {
      render(<TimesheetStatusBadge status="draft" size="lg" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Custom ClassName', () => {
    it('applies additional className', () => {
      render(<TimesheetStatusBadge status="draft" className="custom-class" />);

      const badge = screen.getByTestId('timesheet-status-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });
});
