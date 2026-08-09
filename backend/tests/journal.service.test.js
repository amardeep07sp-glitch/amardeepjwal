import { jest } from '@jest/globals';

const mockAccountRepo = { findRawById: jest.fn(), applyBalanceDelta: jest.fn(), findByCode: jest.fn() };
const mockJournalRepo = {
  create: jest.fn(),
  createLines: jest.fn(),
  findById: jest.fn(),
  linesForJournal: jest.fn(),
  updateById: jest.fn(),
};
const mockJournalNumbering = { getNextJournalNumber: jest.fn() };
const mockActivityLogService = { record: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/accounting/account.repository.js', () => ({ accountRepository: mockAccountRepo }));
jest.unstable_mockModule('../src/modules/accounting/journal.repository.js', () => ({ journalRepository: mockJournalRepo }));
jest.unstable_mockModule('../src/modules/accounting/journal.numbering.js', () => ({ journalNumbering: mockJournalNumbering }));
jest.unstable_mockModule('../src/modules/activityLog/activityLog.service.js', () => ({ activityLogService: mockActivityLogService }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { journalService } = await import('../src/modules/accounting/journal.service.js');

const assetAccount = { _id: 'acc-cash', type: 'asset', name: 'Cash', active: true };
const incomeAccount = { _id: 'acc-revenue', type: 'income', name: 'Sales Revenue', active: true };
const liabilityAccount = { _id: 'acc-ap', type: 'liability', name: 'Accounts Payable', active: true };
const equityAccount = { _id: 'acc-equity', type: 'equity', name: 'Opening Balance Equity', active: true };

beforeEach(() => {
  [mockAccountRepo, mockJournalRepo, mockJournalNumbering, mockActivityLogService, mockSession].forEach((mockObj) =>
    Object.values(mockObj).forEach((fn) => fn.mockReset?.())
  );
  mockJournalNumbering.getNextJournalNumber.mockResolvedValue('JRN-0000001');
  mockJournalRepo.create.mockResolvedValue({ _id: 'j1', journalNumber: 'JRN-0000001' });
});

describe('journalService.postJournal - validation', () => {
  it('rejects a journal with fewer than two lines', async () => {
    await expect(
      journalService.postJournal({ eventType: 'manual', lines: [{ account: 'acc1', debit: 100, credit: 0 }] })
    ).rejects.toThrow('at least two lines');
  });

  it('rejects a line carrying both a debit and a credit', async () => {
    await expect(
      journalService.postJournal({
        eventType: 'manual',
        lines: [
          { account: 'acc1', debit: 100, credit: 50 },
          { account: 'acc2', debit: 0, credit: 100 },
        ],
      })
    ).rejects.toThrow('cannot have both a debit and a credit');
  });

  it('rejects an unbalanced journal (total debit != total credit)', async () => {
    await expect(
      journalService.postJournal({
        eventType: 'manual',
        lines: [
          { account: 'acc1', debit: 100, credit: 0 },
          { account: 'acc2', debit: 0, credit: 90 },
        ],
      })
    ).rejects.toThrow('Unbalanced journal');
  });

  it('rejects an unknown event type', async () => {
    await expect(
      journalService.postJournal({
        eventType: 'not_a_real_event',
        lines: [
          { account: 'acc1', debit: 100, credit: 0 },
          { account: 'acc2', debit: 0, credit: 100 },
        ],
      })
    ).rejects.toThrow('Unknown accounting event type');
  });

  it('rejects posting against an inactive account', async () => {
    mockAccountRepo.findRawById.mockResolvedValueOnce({ ...assetAccount, active: false }).mockResolvedValueOnce(incomeAccount);

    await expect(
      journalService.postJournal({
        eventType: 'manual',
        lines: [
          { account: 'acc-cash', debit: 100, credit: 0 },
          { account: 'acc-revenue', debit: 0, credit: 100 },
        ],
      })
    ).rejects.toThrow('inactive');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('journalService.postJournal - balance application', () => {
  it('increases a debit-normal (asset) account and a credit-normal (income) account correctly', async () => {
    mockAccountRepo.findRawById.mockResolvedValueOnce(assetAccount).mockResolvedValueOnce(incomeAccount);

    await journalService.postJournal({
      eventType: 'manual',
      lines: [
        { account: 'acc-cash', debit: 500, credit: 0 },
        { account: 'acc-revenue', debit: 0, credit: 500 },
      ],
    });

    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith('acc-cash', 500, mockSession);
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith('acc-revenue', 500, mockSession);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('decreases a debit-normal account when credited and a credit-normal account when debited', async () => {
    mockAccountRepo.findRawById.mockResolvedValueOnce(liabilityAccount).mockResolvedValueOnce(assetAccount);

    await journalService.postJournal({
      eventType: 'manual',
      lines: [
        { account: 'acc-ap', debit: 200, credit: 0 },
        { account: 'acc-cash', debit: 0, credit: 200 },
      ],
    });

    // Liability debited -> decreases.
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith('acc-ap', -200, mockSession);
    // Asset credited -> decreases.
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith('acc-cash', -200, mockSession);
  });

  it('reuses the caller-provided session instead of opening its own transaction', async () => {
    mockAccountRepo.findRawById.mockResolvedValueOnce(assetAccount).mockResolvedValueOnce(incomeAccount);
    const externalSession = { fake: true };

    await journalService.postJournal(
      {
        eventType: 'manual',
        lines: [
          { account: 'acc-cash', debit: 100, credit: 0 },
          { account: 'acc-revenue', debit: 0, credit: 100 },
        ],
      },
      externalSession
    );

    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith('acc-cash', 100, externalSession);
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });
});

describe('journalService.reverseJournal', () => {
  it('posts a new journal with every line swapped and flags the original reversed', async () => {
    const original = { _id: 'j1', journalNumber: 'JRN-0000001', status: 'posted', eventType: 'sale', referenceType: 'order', referenceId: 'o1', totalAmount: 500 };
    mockJournalRepo.findById.mockResolvedValue(original);
    mockJournalRepo.linesForJournal.mockResolvedValue([
      { account: assetAccount, debit: 500, credit: 0, party: null, narration: '' },
      { account: incomeAccount, debit: 0, credit: 500, party: null, narration: '' },
    ]);
    mockJournalRepo.create.mockResolvedValue({ _id: 'j2', journalNumber: 'JRN-0000002' });

    await journalService.reverseJournal('j1', { reason: 'correction', performedBy: 'u1' });

    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(assetAccount._id, -500, mockSession);
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(incomeAccount._id, -500, mockSession);
    expect(mockJournalRepo.updateById).toHaveBeenCalledWith('j1', { status: 'reversed' }, mockSession);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('rejects reversing a journal that is not posted', async () => {
    mockJournalRepo.findById.mockResolvedValue({ _id: 'j1', status: 'reversed' });

    await expect(journalService.reverseJournal('j1', { performedBy: 'u1' })).rejects.toThrow('Only a posted journal');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('journalService.recordOpeningBalance', () => {
  it('debits an asset account and credits Opening Balance Equity', async () => {
    mockAccountRepo.findByCode.mockResolvedValue(equityAccount);
    mockAccountRepo.findRawById.mockResolvedValueOnce(assetAccount).mockResolvedValueOnce(equityAccount);

    await journalService.recordOpeningBalance(assetAccount, 1000, 'u1');

    // Funding an asset's opening balance increases Equity too (Dr Asset /
    // Cr Equity) - both sides increase.
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(assetAccount._id, 1000, mockSession);
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(equityAccount._id, 1000, mockSession);
  });

  it('credits a liability account and debits Opening Balance Equity', async () => {
    mockAccountRepo.findByCode.mockResolvedValue(equityAccount);
    mockAccountRepo.findRawById.mockResolvedValueOnce(liabilityAccount).mockResolvedValueOnce(equityAccount);

    await journalService.recordOpeningBalance(liabilityAccount, 1000, 'u1');

    // Recording a liability's opening balance reduces Equity (Dr Equity /
    // Cr Liability) - you now owe money against no offsetting asset.
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(liabilityAccount._id, 1000, mockSession);
    expect(mockAccountRepo.applyBalanceDelta).toHaveBeenCalledWith(equityAccount._id, -1000, mockSession);
  });
});
