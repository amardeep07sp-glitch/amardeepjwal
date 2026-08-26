import { jest } from '@jest/globals';
import crypto from 'crypto';

const mockUserRepo = { findByEmail: jest.fn(), findByPhone: jest.fn(), create: jest.fn(), setRefreshTokenHash: jest.fn() };
const mockOtpRepo = { upsert: jest.fn(), findByEmail: jest.fn(), incrementAttempts: jest.fn(), deleteByEmail: jest.fn() };
const mockSendEmail = jest.fn();
const mockResolveCustomer = jest.fn();

jest.unstable_mockModule('../src/modules/auth/auth.repository.js', () => ({ userRepository: mockUserRepo }));
jest.unstable_mockModule('../src/modules/auth/registrationOtp.repository.js', () => ({ registrationOtpRepository: mockOtpRepo }));
jest.unstable_mockModule('../src/modules/shared/notification.sender.js', () => ({ notificationSender: { sendEmail: mockSendEmail } }));
jest.unstable_mockModule('../src/modules/storefront/storefront.service.js', () => ({
  storefrontService: { resolveCustomer: mockResolveCustomer },
}));

const { authService } = await import('../src/modules/auth/auth.service.js');

beforeEach(() => {
  [mockUserRepo, mockOtpRepo].forEach((repo) => Object.values(repo).forEach((fn) => fn.mockReset()));
  mockSendEmail.mockReset().mockResolvedValue({ sent: true });
  mockResolveCustomer.mockReset().mockResolvedValue(undefined);
  mockUserRepo.findByEmail.mockResolvedValue(null);
  mockUserRepo.findByPhone.mockResolvedValue(null);
  mockUserRepo.setRefreshTokenHash.mockResolvedValue({});
});

describe('authService.startRegistration', () => {
  it('emails a real 6-digit OTP and stores only its hash', async () => {
    await authService.startRegistration({ phone: '9876543210', email: 'new@example.com' });

    expect(mockOtpRepo.upsert).toHaveBeenCalledTimes(1);
    const [email, data] = mockOtpRepo.upsert.mock.calls[0];
    expect(email).toBe('new@example.com');
    expect(data.phone).toBe('9876543210');
    expect(data.otpHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex, never the raw code
    expect(data.otpExpires).toBeInstanceOf(Date);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, html] = mockSendEmail.mock.calls[0];
    expect(to).toBe('new@example.com');
    expect(subject).toMatch(/verification/i);
    expect(html).toMatch(/\d{6}/); // the real code appears in the email body
  });

  it('rejects when the email is already registered', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ _id: 'u1' });
    await expect(authService.startRegistration({ phone: '9876543210', email: 'taken@example.com' })).rejects.toThrow(/already exists/i);
    expect(mockOtpRepo.upsert).not.toHaveBeenCalled();
  });

  it('rejects when the phone is already registered', async () => {
    mockUserRepo.findByPhone.mockResolvedValue({ _id: 'u1' });
    await expect(authService.startRegistration({ phone: '9876543210', email: 'new@example.com' })).rejects.toThrow(/already exists/i);
  });

  it('throws (does not fake success) if the email fails to send', async () => {
    mockSendEmail.mockResolvedValue({ sent: false, reason: 'not configured' });
    await expect(authService.startRegistration({ phone: '9876543210', email: 'new@example.com' })).rejects.toThrow(/could not send/i);
  });
});

describe('authService.completeRegistration', () => {
  const setPending = (overrides = {}) => {
    const otp = '123456';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    mockOtpRepo.findByEmail.mockResolvedValue({
      email: 'new@example.com',
      phone: '9876543210',
      otpHash,
      otpExpires: new Date(Date.now() + 60000),
      attempts: 0,
      ...overrides,
    });
    return otp;
  };

  it('creates the real account and issues a session when the OTP matches', async () => {
    const otp = setPending();
    mockUserRepo.create.mockResolvedValue({ _id: 'u1', name: 'Test', email: 'new@example.com', phone: '9876543210', role: 'customer', isActive: true });

    const result = await authService.completeRegistration({ email: 'new@example.com', otp, name: 'Test', password: 'password123' });

    expect(mockUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', email: 'new@example.com', phone: '9876543210', password: 'password123' })
    );
    expect(mockOtpRepo.deleteByEmail).toHaveBeenCalledWith('new@example.com');
    expect(result.user.email).toBe('new@example.com');
    expect(result.accessToken).toBeTruthy();
  });

  it('rejects and increments attempts on a wrong code, without creating an account', async () => {
    setPending();
    await expect(
      authService.completeRegistration({ email: 'new@example.com', otp: '000000', name: 'Test', password: 'password123' })
    ).rejects.toThrow(/incorrect/i);
    expect(mockOtpRepo.incrementAttempts).toHaveBeenCalledWith('new@example.com');
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an expired code', async () => {
    const otp = setPending({ otpExpires: new Date(Date.now() - 1000) });
    await expect(authService.completeRegistration({ email: 'new@example.com', otp, name: 'Test', password: 'password123' })).rejects.toThrow(
      /expired/i
    );
  });

  it('rejects once too many wrong attempts have been made', async () => {
    const otp = setPending({ attempts: 5 });
    await expect(authService.completeRegistration({ email: 'new@example.com', otp, name: 'Test', password: 'password123' })).rejects.toThrow(
      /too many/i
    );
    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });

  it('rejects if no OTP was ever requested for this email', async () => {
    mockOtpRepo.findByEmail.mockResolvedValue(null);
    await expect(
      authService.completeRegistration({ email: 'ghost@example.com', otp: '123456', name: 'Test', password: 'password123' })
    ).rejects.toThrow(/expired/i);
  });
});
