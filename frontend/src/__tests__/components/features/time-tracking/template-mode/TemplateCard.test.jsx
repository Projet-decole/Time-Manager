// frontend/src/__tests__/components/features/time-tracking/template-mode/TemplateCard.test.jsx
// Story 4.10: Implement Template Mode UI - TemplateCard Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '../../../../../components/features/time-tracking/template-mode/TemplateCard';

describe('TemplateCard', () => {
  const defaultProps = {
    template: {
      id: 'template-1',
      name: 'Morning Development',
      description: 'Standard morning work pattern',
      entries: [
        { id: 'e1', startTime: '09:00', endTime: '12:00', project: { name: 'PRJ-001' } },
        { id: 'e2', startTime: '12:00', endTime: '13:00', category: { name: 'Pause', color: '#FFA500' } },
        { id: 'e3', startTime: '13:00', endTime: '17:00' }
      ]
    },
    onClick: vi.fn(),
    onApply: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders template name and description', () => {
    render(<TemplateCard {...defaultProps} />);

    expect(screen.getByText('Morning Development')).toBeInTheDocument();
    expect(screen.getByText('Standard morning work pattern')).toBeInTheDocument();
  });

  it('renders blocks count', () => {
    render(<TemplateCard {...defaultProps} />);

    expect(screen.getByText('3 blocs')).toBeInTheDocument();
  });

  it('renders singular block when one entry', () => {
    const props = {
      ...defaultProps,
      template: {
        ...defaultProps.template,
        entries: [{ id: 'e1', startTime: '09:00', endTime: '12:00' }]
      }
    };

    render(<TemplateCard {...props} />);

    expect(screen.getByText('1 bloc')).toBeInTheDocument();
  });

  it('renders total duration', () => {
    render(<TemplateCard {...defaultProps} />);

    // 3h + 1h + 4h = 8h
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('renders preview entries (up to 3)', () => {
    render(<TemplateCard {...defaultProps} />);

    expect(screen.getByText('09:00-12:00')).toBeInTheDocument();
    expect(screen.getByText('12:00-13:00')).toBeInTheDocument();
    expect(screen.getByText('13:00-17:00')).toBeInTheDocument();
  });

  it('shows "+X autres blocs" when more than 3 entries', () => {
    const props = {
      ...defaultProps,
      template: {
        ...defaultProps.template,
        entries: [
          { id: 'e1', startTime: '08:00', endTime: '09:00' },
          { id: 'e2', startTime: '09:00', endTime: '10:00' },
          { id: 'e3', startTime: '10:00', endTime: '11:00' },
          { id: 'e4', startTime: '11:00', endTime: '12:00' }
        ]
      }
    };

    render(<TemplateCard {...props} />);

    expect(screen.getByText('+1 autre bloc')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<TemplateCard {...defaultProps} />);

    const card = screen.getByRole('button', { name: /Appliquer/i }).closest('.cursor-pointer');
    fireEvent.click(card);

    expect(defaultProps.onClick).toHaveBeenCalledWith(defaultProps.template);
  });

  it('calls onApply when Apply button is clicked', () => {
    render(<TemplateCard {...defaultProps} />);

    const applyButton = screen.getByRole('button', { name: /Appliquer/i });
    fireEvent.click(applyButton);

    expect(defaultProps.onApply).toHaveBeenCalledWith(defaultProps.template);
    expect(defaultProps.onClick).not.toHaveBeenCalled(); // Should stop propagation
  });

  it('shows options menu when options button is clicked', () => {
    render(<TemplateCard {...defaultProps} />);

    const optionsButton = screen.getByRole('button', { name: /Options/i });
    fireEvent.click(optionsButton);

    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('calls onEdit when Modifier is clicked in menu', () => {
    render(<TemplateCard {...defaultProps} />);

    const optionsButton = screen.getByRole('button', { name: /Options/i });
    fireEvent.click(optionsButton);

    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.template);
  });

  it('calls onDelete when Supprimer is clicked in menu', () => {
    render(<TemplateCard {...defaultProps} />);

    const optionsButton = screen.getByRole('button', { name: /Options/i });
    fireEvent.click(optionsButton);

    const deleteButton = screen.getByText('Supprimer');
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.template);
  });

  it('handles template with no description', () => {
    const props = {
      ...defaultProps,
      template: {
        ...defaultProps.template,
        description: null
      }
    };

    render(<TemplateCard {...props} />);

    expect(screen.getByText('Morning Development')).toBeInTheDocument();
    expect(screen.queryByText('Standard morning work pattern')).not.toBeInTheDocument();
  });

  it('handles template with no entries', () => {
    const props = {
      ...defaultProps,
      template: {
        ...defaultProps.template,
        entries: []
      }
    };

    render(<TemplateCard {...props} />);

    expect(screen.getByText('0 blocs')).toBeInTheDocument();
    expect(screen.getByText('0m')).toBeInTheDocument();
  });
});
