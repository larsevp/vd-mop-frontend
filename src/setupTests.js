import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock import.meta.env with test values (Vitest supports import.meta natively)
import.meta.env = {
  ...import.meta.env,
  VITE_API_URL: 'http://localhost:3001/api',
  VITE_APP_TITLE: 'Test App',
  VITE_ENVIRONMENT: 'test',
  DEV: false,
  PROD: false,
  MODE: 'test'
};

// Mock axios to avoid network calls in tests
import { vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}));