// frontend/src/__tests__/pages/AccessDeniedPage.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccessDeniedPage from '../../pages/AccessDeniedPage';

function renderAccessDeniedPage() {
  return render(
    <MemoryRouter>
      <AccessDeniedPage />
    </MemoryRouter>
  );
}

describe('AccessDeniedPage', () => {
  it('displays access denied message', () => {
    renderAccessDeniedPage();

    expect(screen.getByText(/acces refuse/i)).toBeInTheDocument();
  });

  it('provides a link back to dashboard', () => {
    renderAccessDeniedPage();

    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('displays an explanation message', () => {
    renderAccessDeniedPage();

    expect(screen.getByText(/pas les permissions/i)).toBeInTheDocument();
  });
});
