// frontend/src/__tests__/App.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import App from "../App";

describe("App Component", () => {
	test("renders without crashing", () => {
		render(<App />);
		// Vérifie que le composant s'affiche sans erreur
	});

	test("displays Vite + React logos", () => {
		render(<App />);
		const logos = screen.getAllByRole("img");
		expect(logos.length).toBeGreaterThan(0);
	});
});
