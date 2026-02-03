// Import global setup (ensures DOM is available)
import { localStorageMock } from "./global-setup";

// Import testing library after DOM is set up
import { afterAll, afterEach, beforeAll, beforeEach } from "bun:test";
import { resetIdCounter } from "./fixtures";
import { configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Configure testing library
configure({
  asyncUtilTimeout: 5000,
});

// MSW server lifecycle
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  resetIdCounter();
});

afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
  // Clear the document body between tests
  document.body.innerHTML = "";
});

afterAll(() => {
  server.close();
});
