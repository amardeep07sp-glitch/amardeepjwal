import { jest } from '@jest/globals';

const mockOrderService = { getSalesTrend: jest.fn() };
const mockPurchaseOrderService = { getPurchaseTrend: jest.fn() };
const mockFinancialDashboardService = { getDashboardTotals: jest.fn(), getCashFlowTrend: jest.fn(), getProfitTrend: jest.fn() };
const mockSalesReportsService = { getSalesSummary: jest.fn(), getSalesByCategory: jest.fn(), getSalesByProduct: jest.fn() };
const mockPurchaseReportsService = { getPurchaseSummary: jest.fn() };
const mockInventoryReportsService = { getInventoryValuation: jest.fn() };
const mockCustomerReportsService = { getWalletSummary: jest.fn() };

jest.unstable_mockModule('../src/modules/order/order.service.js', () => ({ orderService: mockOrderService }));
jest.unstable_mockModule('../src/modules/purchase/purchaseOrder.service.js', () => ({ purchaseOrderService: mockPurchaseOrderService }));
jest.unstable_mockModule('../src/modules/accounting/financialDashboard.service.js', () => ({ financialDashboardService: mockFinancialDashboardService }));
jest.unstable_mockModule('../src/modules/reports/salesReports.service.js', () => ({ salesReportsService: mockSalesReportsService }));
jest.unstable_mockModule('../src/modules/reports/purchaseReports.service.js', () => ({ purchaseReportsService: mockPurchaseReportsService }));
jest.unstable_mockModule('../src/modules/reports/inventoryReports.service.js', () => ({ inventoryReportsService: mockInventoryReportsService }));
jest.unstable_mockModule('../src/modules/reports/customerReports.service.js', () => ({ customerReportsService: mockCustomerReportsService }));

const { executiveDashboardService } = await import('../src/modules/reports/executiveDashboard.service.js');

beforeEach(() => {
  [
    mockOrderService,
    mockPurchaseOrderService,
    mockFinancialDashboardService,
    mockSalesReportsService,
    mockPurchaseReportsService,
    mockInventoryReportsService,
    mockCustomerReportsService,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
});

describe('executiveDashboardService.getDashboardCards', () => {
  it('assembles every card from its owning module, without recomputing any of them', async () => {
    mockFinancialDashboardService.getDashboardTotals.mockResolvedValue({ revenue: 1000, profit: 400, expenses: 600, receivables: 200, payables: 150, cash: 900 });
    mockSalesReportsService.getSalesSummary.mockResolvedValue({ orderCount: 12 });
    mockPurchaseReportsService.getPurchaseSummary.mockResolvedValue({ totalValue: 500 });
    mockInventoryReportsService.getInventoryValuation.mockResolvedValue({ grandTotal: 3000 });
    mockCustomerReportsService.getWalletSummary.mockResolvedValue({ totalBalance: 75 });

    const cards = await executiveDashboardService.getDashboardCards();

    expect(cards).toEqual({
      revenue: 1000,
      profit: 400,
      expenses: 600,
      sales: 12,
      purchases: 500,
      inventoryValue: 3000,
      outstandingReceivables: 200,
      outstandingPayables: 150,
      walletBalance: 75,
    });
  });
});

describe('executiveDashboardService.getDashboardCharts', () => {
  it('assembles every chart series from its owning module', async () => {
    mockOrderService.getSalesTrend.mockResolvedValue([{ date: '2026-01-01', revenue: 100 }]);
    mockPurchaseOrderService.getPurchaseTrend.mockResolvedValue([{ date: '2026-01-01', value: 50 }]);
    mockFinancialDashboardService.getCashFlowTrend.mockResolvedValue([{ date: '2026-01-01', netFlow: 20 }]);
    mockFinancialDashboardService.getProfitTrend.mockResolvedValue([{ date: '2026-01-01', profit: 30 }]);
    mockSalesReportsService.getSalesByCategory.mockResolvedValue({ items: [{ name: 'Rings', revenue: 500 }] });
    mockSalesReportsService.getSalesByProduct.mockResolvedValue({ items: [{ name: 'Gold Ring', revenue: 300 }] });

    const charts = await executiveDashboardService.getDashboardCharts({ days: 7 });

    expect(mockOrderService.getSalesTrend).toHaveBeenCalledWith(7);
    expect(charts.topCategories).toEqual([{ name: 'Rings', revenue: 500 }]);
    expect(charts.topProducts).toEqual([{ name: 'Gold Ring', revenue: 300 }]);
    expect(charts.cashFlow).toEqual([{ date: '2026-01-01', netFlow: 20 }]);
  });
});
