import { jest } from '@jest/globals';

const mockBroadcastRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  findPaginated: jest.fn(),
  findActiveWebsite: jest.fn(),
};
const mockCustomerRepo = { streamAllContacts: jest.fn() };
const mockCustomerPreferenceRepo = { findAllCommunicationPrefs: jest.fn() };
const mockNotificationSender = { sendEmail: jest.fn(), sendWhatsApp: jest.fn() };

jest.unstable_mockModule('../src/modules/broadcast/broadcast.repository.js', () => ({ broadcastRepository: mockBroadcastRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.repository.js', () => ({ customerRepository: mockCustomerRepo }));
jest.unstable_mockModule('../src/modules/customer/customerPreference.repository.js', () => ({
  customerPreferenceRepository: mockCustomerPreferenceRepo,
}));
jest.unstable_mockModule('../src/modules/shared/notification.sender.js', () => ({ notificationSender: mockNotificationSender }));

const { broadcastService } = await import('../src/modules/broadcast/broadcast.service.js');
const { BROADCAST_STATUSES } = await import('../src/modules/broadcast/broadcast.constants.js');

// A minimal async iterable standing in for the real Mongoose cursor
// (`for await...of` just needs Symbol.asyncIterator) - lets tests control
// exactly which "customers" the broadcast processes without touching Mongo.
function fakeCursor(customers) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        next: () => Promise.resolve(i < customers.length ? { value: customers[i++], done: false } : { value: undefined, done: true }),
      };
    },
  };
}

// processBroadcast runs un-awaited in the background and includes a real
// 200ms inter-chunk pause (broadcast.service.js's CHUNK_DELAY_MS) - tests
// that assert on its outcome need to actually wait past that, not just
// flush one microtask tick.
const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

beforeEach(() => {
  [mockBroadcastRepo, mockCustomerRepo, mockCustomerPreferenceRepo, mockNotificationSender].forEach((mockObj) =>
    Object.values(mockObj).forEach((fn) => fn.mockReset?.())
  );
  mockNotificationSender.sendEmail.mockResolvedValue({ sent: true });
  mockNotificationSender.sendWhatsApp.mockResolvedValue({ sent: true });
  mockCustomerPreferenceRepo.findAllCommunicationPrefs.mockResolvedValue([]);
  mockCustomerRepo.streamAllContacts.mockReturnValue(fakeCursor([]));
  mockBroadcastRepo.updateById.mockResolvedValue({});
});

describe('broadcastService.createBroadcast', () => {
  it('creates the broadcast row immediately and returns it without waiting for sends to finish', async () => {
    const created = { _id: 'b1', channels: ['website'] };
    mockBroadcastRepo.create.mockResolvedValue(created);
    mockBroadcastRepo.findById.mockResolvedValue({ _id: 'b1', channels: ['website'], title: 't', message: 'm' });

    const result = await broadcastService.createBroadcast(
      { title: 't', message: 'm', channels: ['website'], expiresAt: null },
      'admin1'
    );

    expect(result).toBe(created);
    expect(mockBroadcastRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 't', message: 'm', channels: ['website'], createdBy: 'admin1' })
    );
  });

  it('sends email + WhatsApp to every customer who is opted in and has that contact detail', async () => {
    mockBroadcastRepo.create.mockResolvedValue({ _id: 'b1' });
    mockBroadcastRepo.findById.mockResolvedValue({
      _id: 'b1',
      channels: ['email', 'whatsapp'],
      title: 'Sale',
      message: '50% off',
    });
    mockCustomerRepo.streamAllContacts.mockReturnValue(
      fakeCursor([
        { _id: 'c1', email: 'a@x.com', phone: '111' },
        { _id: 'c2', email: null, phone: '222' },
      ])
    );

    await broadcastService.createBroadcast({ title: 'Sale', message: '50% off', channels: ['email', 'whatsapp'] }, 'admin1');
    await wait(350);

    expect(mockNotificationSender.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockNotificationSender.sendEmail).toHaveBeenCalledWith('a@x.com', 'Sale', expect.stringContaining('50% off'));
    expect(mockNotificationSender.sendWhatsApp).toHaveBeenCalledTimes(2);
    const finalCall = mockBroadcastRepo.updateById.mock.calls.find((c) => c[1].status === BROADCAST_STATUSES.COMPLETED);
    expect(finalCall).toBeTruthy();
  });

  it('skips a channel for a customer who opted out via CustomerPreference, without touching other customers', async () => {
    mockBroadcastRepo.create.mockResolvedValue({ _id: 'b1' });
    mockBroadcastRepo.findById.mockResolvedValue({ _id: 'b1', channels: ['email'], title: 'T', message: 'M' });
    mockCustomerRepo.streamAllContacts.mockReturnValue(
      fakeCursor([
        { _id: 'c1', email: 'opted-out@x.com', phone: null },
        { _id: 'c2', email: 'opted-in@x.com', phone: null },
      ])
    );
    mockCustomerPreferenceRepo.findAllCommunicationPrefs.mockResolvedValue([
      { customer: 'c1', communicationPreference: { email: false, whatsapp: true } },
    ]);

    await broadcastService.createBroadcast({ title: 'T', message: 'M', channels: ['email'] }, 'admin1');
    await wait(350);

    expect(mockNotificationSender.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockNotificationSender.sendEmail).toHaveBeenCalledWith('opted-in@x.com', 'T', expect.any(String));
  });

  it('marks the broadcast failed (not stuck at sending) if a step throws unexpectedly', async () => {
    mockBroadcastRepo.create.mockResolvedValue({ _id: 'b1' });
    mockBroadcastRepo.findById.mockResolvedValue({ _id: 'b1', channels: ['email'], title: 'T', message: 'M' });
    mockCustomerPreferenceRepo.findAllCommunicationPrefs.mockRejectedValue(new Error('db down'));

    await broadcastService.createBroadcast({ title: 'T', message: 'M', channels: ['email'] }, 'admin1');
    await wait(350);

    const failedCall = mockBroadcastRepo.updateById.mock.calls.find((c) => c[1].status === BROADCAST_STATUSES.FAILED);
    expect(failedCall).toBeTruthy();
    expect(failedCall[1].failureReason).toBe('db down');
  });
});

describe('broadcastService.deactivateBroadcast', () => {
  it('throws 404 for a broadcast that does not exist', async () => {
    mockBroadcastRepo.updateById.mockResolvedValue(null);
    await expect(broadcastService.deactivateBroadcast('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
