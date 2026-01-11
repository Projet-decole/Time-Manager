// frontend/src/__tests__/components/features/categories/CategoriesList.test.jsx
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesList } from '../../../../components/features/categories/CategoriesList';

const mockCategories = [
  {
    id: '1',
    name: 'Development',
    description: 'Coding and development tasks',
    color: '#3B82F6',
    isActive: true
  },
  {
    id: '2',
    name: 'Meeting',
    description: 'Team meetings and discussions with very long description that should be truncated',
    color: '#10B981',
    isActive: true
  },
  {
    id: '3',
    name: 'Admin',
    description: 'Administrative work',
    color: '#EF4444',
    isActive: false
  }
];

describe('CategoriesList', () => {
  const defaultProps = {
    categories: mockCategories,
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    onActivate: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('displays loading message when loading is true', () => {
      render(<CategoriesList {...defaultProps} loading={true} />);

      expect(screen.getByText(/chargement des categories/i)).toBeInTheDocument();
    });

    it('does not display table when loading', () => {
      render(<CategoriesList {...defaultProps} loading={true} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty message when no categories', () => {
      render(<CategoriesList {...defaultProps} categories={[]} />);

      expect(screen.getByText(/aucune categorie/i)).toBeInTheDocument();
    });

    it('displays empty message when categories is null', () => {
      render(<CategoriesList {...defaultProps} categories={null} />);

      expect(screen.getByText(/aucune categorie/i)).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders table with correct headers', () => {
      render(<CategoriesList {...defaultProps} />);

      expect(screen.getByText('Couleur')).toBeInTheDocument();
      expect(screen.getByText('Nom')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders all category names', () => {
      render(<CategoriesList {...defaultProps} />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Meeting')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('renders color chips for each category', () => {
      render(<CategoriesList {...defaultProps} />);

      const colorChips = screen.getAllByLabelText(/couleur #/i);
      expect(colorChips).toHaveLength(3);
    });

    it('truncates long descriptions', () => {
      render(<CategoriesList {...defaultProps} />);

      // The long description should be truncated with ...
      expect(screen.getByText(/team meetings and discussions with very long/i)).toBeInTheDocument();
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('displays Actif badge for active categories', () => {
      render(<CategoriesList {...defaultProps} />);

      const activeBadges = screen.getAllByText('Actif');
      expect(activeBadges).toHaveLength(2); // Development and Meeting
    });

    it('displays Inactif badge for inactive categories', () => {
      render(<CategoriesList {...defaultProps} />);

      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });

    it('applies visual distinction to inactive rows', () => {
      render(<CategoriesList {...defaultProps} />);

      // Find the Admin row (inactive)
      const adminRow = screen.getByText('Admin').closest('tr');
      expect(adminRow).toHaveClass('opacity-60');
      expect(adminRow).toHaveClass('bg-gray-50');
    });
  });

  describe('Action Buttons', () => {
    it('displays Modifier button for each category', () => {
      render(<CategoriesList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      expect(editButtons).toHaveLength(3);
    });

    it('displays Desactiver button for active categories', () => {
      render(<CategoriesList {...defaultProps} />);

      const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
      expect(deactivateButtons).toHaveLength(2); // Development and Meeting
    });

    it('displays Activer button for inactive categories', () => {
      render(<CategoriesList {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit with category when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<CategoriesList {...defaultProps} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockCategories[0]);
    });

    it('calls onDeactivate with category when deactivate button clicked', async () => {
      const user = userEvent.setup();
      const onDeactivate = vi.fn();
      render(<CategoriesList {...defaultProps} onDeactivate={onDeactivate} />);

      const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
      await user.click(deactivateButtons[0]);

      expect(onDeactivate).toHaveBeenCalledWith(mockCategories[0]);
    });

    it('calls onActivate with category when activate button clicked', async () => {
      const user = userEvent.setup();
      const onActivate = vi.fn();
      render(<CategoriesList {...defaultProps} onActivate={onActivate} />);

      const activateButton = screen.getByRole('button', { name: 'Activer' });
      await user.click(activateButton);

      expect(onActivate).toHaveBeenCalledWith(mockCategories[2]); // Admin (inactive)
    });
  });
});
