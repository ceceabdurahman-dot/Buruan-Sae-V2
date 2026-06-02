import { vi } from 'vitest';

// ============================================================
// Test Setup Global
// ============================================================

// Mock environment vars untuk test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-nik-data';
process.env.ENCRYPTION_SALT = 'test-salt-v1';
process.env.FONNTE_API_KEY = 'mock-fonnte-key';
process.env.MIDTRANS_SERVER_KEY = 'mock-midtrans-server-key';
process.env.MIDTRANS_CLIENT_KEY = 'mock-midtrans-client-key';
process.env.FCM_SERVER_KEY = 'mock-fcm-key';

// Nonaktifkan log selama test
vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  }),
}));
