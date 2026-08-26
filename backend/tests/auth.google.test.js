import { jest } from '@jest/globals';

const mockUserRepo = {
  findByGoogleId: jest.fn(),
  findByEmail: jest.fn(),
  linkGoogleId: jest.fn(),
  create: jest.fn(),
  setRefreshTokenHash: jest.fn(),
};
const mockVerifyIdToken = jest.fn();
const mockResolveCustomer = jest.fn();

jest.unstable_mockModule('../src/modules/auth/auth.repository.js', () => ({ userRepository: mockUserRepo }));
jest.unstable_mockModule('../src/modules/storefront/storefront.service.js', () => ({
  storefrontService: { resolveCustomer: mockResolveCustomer },
}));
jest.unstable_mockModule('../src/modules/shared/notification.sender.js', () => ({
  notificationSender: { sendEmail: jest.fn() },
}));
// google-auth-library's real network call (fetching Google's public keys)
// has no place in a unit test - only the shape this service actually uses
// (`new OAuth2Client(...).verifyIdToken(...)`) is faked.
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

const { authService } = await import('../src/modules/auth/auth.service.js');

const googlePayload = (overrides = {}) => ({
  sub: 'google-sub-123',
  email: 'newgoogleuser@example.com',
  email_verified: true,
  name: 'Google User',
  ...overrides,
});

beforeEach(() => {
  Object.values(mockUserRepo).forEach((fn) => fn.mockReset());
  mockVerifyIdToken.mockReset();
  mockResolveCustomer.mockReset().mockResolvedValue(undefined);
  mockUserRepo.setRefreshTokenHash.mockResolvedValue({});
});

describe('authService.loginWithGoogle', () => {
  it('rejects a token that fails verification', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad signature'));

    await expect(authService.loginWithGoogle('bad-token')).rejects.toThrow(/invalid or expired/i);
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an unverified Google email', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload({ email_verified: false }) });

    await expect(authService.loginWithGoogle('token')).rejects.toThrow(/not verified/i);
  });

  it('creates a new password-less account for a first-time Google sign-in', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload() });
    mockUserRepo.findByGoogleId.mockResolvedValue(null);
    mockUserRepo.findByEmail.mockResolvedValue(null);
    const created = { _id: 'u1', name: 'Google User', email: 'newgoogleuser@example.com', role: 'customer', isActive: true };
    mockUserRepo.create.mockResolvedValue(created);

    const result = await authService.loginWithGoogle('token');

    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newgoogleuser@example.com', authProvider: 'google', googleId: 'google-sub-123' })
    );
    expect(result.user.email).toBe('newgoogleuser@example.com');
    expect(result.accessToken).toBeTruthy();
  });

  it('links Google to an existing password account with the same email instead of duplicating it', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload({ email: 'existing@example.com' }) });
    mockUserRepo.findByGoogleId.mockResolvedValue(null);
    const existing = { _id: 'u2', email: 'existing@example.com', role: 'customer', isActive: true };
    mockUserRepo.findByEmail.mockResolvedValue(existing);
    mockUserRepo.linkGoogleId.mockResolvedValue({ ...existing, googleId: 'google-sub-123' });

    await authService.loginWithGoogle('token');

    expect(mockUserRepo.linkGoogleId).toHaveBeenCalledWith('u2', 'google-sub-123');
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('logs a returning Google user straight in by googleId without touching findByEmail', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload() });
    mockUserRepo.findByGoogleId.mockResolvedValue({ _id: 'u3', email: 'newgoogleuser@example.com', role: 'customer', isActive: true });

    await authService.loginWithGoogle('token');

    expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('rejects a deactivated account', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload() });
    mockUserRepo.findByGoogleId.mockResolvedValue({ _id: 'u4', email: 'x@example.com', role: 'customer', isActive: false });

    await expect(authService.loginWithGoogle('token')).rejects.toThrow(/deactivated/i);
  });
});
