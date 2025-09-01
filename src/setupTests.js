import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Provide safe defaults for import.meta.env in tests only if not already set
const testEnv = { ...(import.meta.env || {}) };
if (!testEnv.VITE_API_URL) testEnv.VITE_API_URL = "http://localhost:0/api";
if (!testEnv.VITE_MSAL_TENANT_ID) testEnv.VITE_MSAL_TENANT_ID = "00000000-0000-0000-0000-000000000000";
if (!testEnv.VITE_MSAL_CLIENT_ID) testEnv.VITE_MSAL_CLIENT_ID = "00000000-0000-0000-0000-000000000000";
if (!testEnv.VITE_APP_TITLE) testEnv.VITE_APP_TITLE = "Test App";
if (!testEnv.VITE_ENVIRONMENT) testEnv.VITE_ENVIRONMENT = "test";
import.meta.env = {
  ...testEnv,
  DEV: false,
  PROD: false,
  MODE: "test",
};

// Mock axios to avoid network calls in tests
import { vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));
