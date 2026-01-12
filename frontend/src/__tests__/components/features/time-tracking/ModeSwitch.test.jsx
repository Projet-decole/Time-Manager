// frontend/src/__tests__/components/features/time-tracking/ModeSwitch.test.jsx
// Story 4.4: Simple Mode UI - ModeSwitch Component Tests
// Story 4.7: Day Mode UI - Journee mode enabled
// Story 4.10: Template Mode UI - Template mode enabled

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSwitch } from '../../../../components/features/time-tracking/ModeSwitch';

describe('ModeSwitch', () => {
  describe('Rendering', () => {
    it('renders three mode options', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      expect(screen.getByText('Tache')).toBeInTheDocument();
      expect(screen.getByText('Journee')).toBeInTheDocument();
      expect(screen.getByText('Template')).toBeInTheDocument();
    });

    it('renders with tablist role', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders tabs with tab role', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });
  });

  describe('Active State', () => {
    it('highlights active mode with aria-selected', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const tacheTab = screen.getByRole('tab', { name: /tache/i });
      expect(tacheTab).toHaveAttribute('aria-selected', 'true');
    });

    it('has white background for active mode', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const tacheTab = screen.getByRole('tab', { name: /tache/i });
      expect(tacheTab).toHaveClass('bg-white');
    });

    it('inactive available modes are not highlighted', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const journeeTab = screen.getByRole('tab', { name: /journee/i });
      expect(journeeTab).toHaveAttribute('aria-selected', 'false');
      expect(journeeTab).not.toHaveClass('bg-white');
    });

    it('highlights Journee mode when active', () => {
      render(<ModeSwitch activeMode="journee" onModeChange={() => {}} />);

      const journeeTab = screen.getByRole('tab', { name: /journee/i });
      expect(journeeTab).toHaveAttribute('aria-selected', 'true');
      expect(journeeTab).toHaveClass('bg-white');
    });

    it('highlights Template mode when active', () => {
      render(<ModeSwitch activeMode="template" onModeChange={() => {}} />);

      const templateTab = screen.getByRole('tab', { name: /template/i });
      expect(templateTab).toHaveAttribute('aria-selected', 'true');
      expect(templateTab).toHaveClass('bg-white');
    });
  });

  describe('All Modes Available', () => {
    it('all three modes are enabled and clickable', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const tacheTab = screen.getByRole('tab', { name: /tache/i });
      const journeeTab = screen.getByRole('tab', { name: /journee/i });
      const templateTab = screen.getByRole('tab', { name: /template/i });

      expect(tacheTab).not.toBeDisabled();
      expect(journeeTab).not.toBeDisabled();
      expect(templateTab).not.toBeDisabled();
    });

    it('available modes have aria-disabled false', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const journeeTab = screen.getByRole('tab', { name: /journee/i });
      const templateTab = screen.getByRole('tab', { name: /template/i });

      expect(journeeTab).toHaveAttribute('aria-disabled', 'false');
      expect(templateTab).toHaveAttribute('aria-disabled', 'false');
    });
  });

  describe('Click Handling', () => {
    it('calls onModeChange when clicking Tache mode', () => {
      const handleChange = vi.fn();
      render(<ModeSwitch activeMode="journee" onModeChange={handleChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /tache/i }));

      expect(handleChange).toHaveBeenCalledWith('tache');
    });

    it('calls onModeChange when clicking Journee mode', () => {
      const handleChange = vi.fn();
      render(<ModeSwitch activeMode="tache" onModeChange={handleChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /journee/i }));

      expect(handleChange).toHaveBeenCalledWith('journee');
    });

    it('calls onModeChange when clicking Template mode', () => {
      const handleChange = vi.fn();
      render(<ModeSwitch activeMode="tache" onModeChange={handleChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /template/i }));

      expect(handleChange).toHaveBeenCalledWith('template');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label for navigation', () => {
      render(<ModeSwitch activeMode="tache" onModeChange={() => {}} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Mode de suivi du temps');
    });
  });

  describe('Custom Class Names', () => {
    it('accepts additional className prop', () => {
      const { container } = render(
        <ModeSwitch activeMode="tache" onModeChange={() => {}} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
