import { jest } from '@jest/globals';

const mockUserRepo = {
  findByEmail: jest.fn(),
  setResetToken: jest.fn(),
  findByEmailWithResetToken: jest.fn(),
  clearResetTokenAndSetPassword: jest.fn(),
};
jest.unstable_mockModule('../src/modules/auth/auth.repository.js', () => ({ userRepository: mockUserRepo }));

const mockSendEmail = jest.fn();
jest.unstable_mockModule('../src/modules/shared/notification.sender.js', () => ({
  notificationSender: { sendEmail: mockSendEmail },
}));

jest.unstable_mockModule('../src/modules/storefront/storefront.service.js', () => ({
  storefrontService: { resolveCustomer: jest.fn() },
}));

const { authService } = await import('../src/modules/auth/auth.service.js');

beforeEach(() => {
  mockUserRepo.findByEmail.mockReset();
  mockUserRepo.setResetToken.mockReset();
  mockUserRepo.findByEmailWithResetToken.mockReset();
  mockUserRepo.clearResetTokenAndSetPassword.mockReset();
  mockSendEmail.mockReset().mockResolvedValue({ sent: true });
});

describe('authService.requestPasswordReset', () => {
  it('does nothing (no error, no email) for an email that has no account', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(authService.requestPasswordReset('nobody@example.com')).resolves.toBeUndefined();

    expect(mockUserRepo.setResetToken).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('stores a hashed token (never the raw token) and emails a reset link for a real account', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ _id: 'user1', name: 'Test User', email: 'test@example.com' });

    await authService.requestPasswordReset('test@example.com');

    expect(mockUserRepo.setResetToken).toHaveBeenCalledTimes(1);
    const [userId, { tokenHash, expires }] = mockUserRepo.setResetToken.mock.calls[0];
    expect(userId).toBe('user1');
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex, never the raw token
    expect(expires).toBeInstanceOf(Date);
    expect(expires.getTime()).toBeGreaterThan(Date.now());

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, html] = mockSendEmail.mock.calls[0];
    expect(to).toBe('test@example.com');
    expect(subject).toMatch(/reset/i);
    expect(html).toContain('reset-password');
  });

  it('never throws even if the email fails to send (e.g. RESEND_API_KEY unset)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ _id: 'user1', name: 'Test User', email: 'test@example.com' });
    mockSendEmail.mockResolvedValue({ sent: false, reason: 'Email not configured' });

    await expect(authService.requestPasswordReset('test@example.com')).resolves.toBeUndefined();
  });
});

describe('authService.resetPassword', () => {
  it('rejects when there is no account for the email', async () => {
    mockUserRepo.findByEmailWithResetToken.mockResolvedValue(null);

    await expect(authService.resetPassword({ email: 'nobody@example.com', token: 'x', newPassword: 'newpass123' })).rejects.toThrow(
      /invalid or has expired/i
    );
    expect(mockUserRepo.clearResetTokenAndSetPassword).not.toHaveBeenCalled();
  });

  it('rejects a token that does not match the stored hash', async () => {
    mockUserRepo.findByEmailWithResetToken.mockResolvedValue({
      _id: 'user1',
      resetPasswordTokenHash: 'some-other-hash',
      resetPasswordExpires: new Date(Date.now() + 60000),
    });

    await expect(authService.resetPassword({ email: 'test@example.com', token: 'wrong-token', newPassword: 'newpass123' })).rejects.toThrow(
      /invalid or has expired/i
    );
    expect(mockUserRepo.clearResetTokenAndSetPassword).not.toHaveBeenCalled();
  });

  it('rejects an expired token even if the hash would otherwise match', async () => {
    const crypto = await import('crypto');
    const token = 'real-token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    mockUserRepo.findByEmailWithResetToken.mockResolvedValue({
      _id: 'user1',
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() - 1000), // already expired
    });

    await expect(authService.resetPassword({ email: 'test@example.com', token, newPassword: 'newpass123' })).rejects.toThrow(
      /invalid or has expired/i
    );
  });

  it('resets the password when the token matches and has not expired', async () => {
    const crypto = await import('crypto');
    const token = 'real-token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    mockUserRepo.findByEmailWithResetToken.mockResolvedValue({
      _id: 'user1',
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 60000),
    });

    await authService.resetPassword({ email: 'test@example.com', token, newPassword: 'newpass123' });

    expect(mockUserRepo.clearResetTokenAndSetPassword).toHaveBeenCalledWith('user1', 'newpass123');
  });
});
