import { jest } from '@jest/globals';

const mockFeedbackRepo = { findPaginated: jest.fn(), create: jest.fn(), getSummary: jest.fn() };

jest.unstable_mockModule('../src/modules/feedback/feedback.repository.js', () => ({ feedbackRepository: mockFeedbackRepo }));

const { feedbackService } = await import('../src/modules/feedback/feedback.service.js');

beforeEach(() => {
  Object.values(mockFeedbackRepo).forEach((fn) => fn.mockReset());
});

describe('feedback.service#submitFeedback', () => {
  it('defaults rating/orderId to null when omitted', async () => {
    mockFeedbackRepo.create.mockResolvedValue({ _id: 'f1' });

    await feedbackService.submitFeedback({ customerId: 'cust1', category: 'website', message: 'Checkout could be faster' });

    expect(mockFeedbackRepo.create).toHaveBeenCalledWith({
      customer: 'cust1',
      rating: null,
      category: 'website',
      message: 'Checkout could be faster',
      pageContext: '',
      orderId: null,
    });
  });
});

describe('feedback.service#listFeedback', () => {
  it('builds pagination meta from the repository totals', async () => {
    mockFeedbackRepo.findPaginated.mockResolvedValue({ items: [{ _id: 'f1' }], total: 45 });

    const result = await feedbackService.listFeedback({ page: 2, limit: 20 });

    expect(result.meta).toEqual({ page: 2, limit: 20, totalItems: 45, totalPages: 3 });
  });
});
