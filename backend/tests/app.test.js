// backend/tests/app.test.js
const request = require("supertest");
const app = require("../app");

describe("API Health Checks", () => {
	// Test 1 : Endpoint racine
	test("GET / should return welcome message", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("message");
		expect(response.body.message).toBe("Time Manager API is running!");
	});

	// Test 2 : Endpoint health
	test("GET /health should return OK status", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("OK");
		expect(response.body).toHaveProperty("timestamp");
	});
});
