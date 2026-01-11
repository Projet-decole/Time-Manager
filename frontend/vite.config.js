// frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/setupTests.js",
		// Garde-fous contre les tests qui bloquent
		testTimeout: 10000, // 10 secondes max par test
		hookTimeout: 10000, // 10 secondes max pour beforeEach/afterEach
		teardownTimeout: 5000, // 5 secondes pour le cleanup
		// Limiter le parallelisme pour eviter surcharge memoire
		pool: "forks", // Isoler chaque fichier de test
		poolOptions: {
			forks: {
				maxForks: 2, // Max 2 workers en parallele
				minForks: 1,
			},
		},
		// Fail fast sur les tests qui bloquent
		bail: 1, // Arreter au premier echec
	},
});
