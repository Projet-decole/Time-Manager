// frontend/src/__tests__/App.test.jsx

import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import App from "../App";

// Mock the authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    getAccessToken: vi.fn(() => null)
  }
}));

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders without crashing", () => {
    render(<App />);
    // App should render the login page by default (root redirects to /login)
  });

  test("displays login page by default", () => {
    render(<App />);
    expect(screen.getByText('Time Manager')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });
});
