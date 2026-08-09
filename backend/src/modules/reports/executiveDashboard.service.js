import { orderService } from '../order/order.service.js';
import { purchaseOrderService } from '../purchase/purchaseOrder.service.js';
import { financialDashboardService } from '../accounting/financialDashboard.service.js';
import { salesReportsService } from './salesReports.service.js';
import { purchaseReportsService } from './purchaseReports.service.js';
import { inventoryReportsService } from './inventoryReports.service.js';
import { customerReportsService } from './customerReports.service.js';

// ===========================================================================
// The cross-module read layer the spec's own flow diagram names explicitly:
// Orders/Inventory/CRM/Purchase/Accounting -> Reporting Service ->
// Aggregation Layer -> Dashboard. Every card and chart here is a thin reuse
// of a method that already exists in its owning module (Order/Purchase/
// Accounting each already compute their own trend/summary) or a Reports
// -module aggregation built earlier in this same phase (Sales/Purchase/
// Inventory/Customer Reports) - nothing is recomputed a second time.
// ===========================================================================
export const executiveDashboardService = {
  async getDashboardCards() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [financial, salesSummary, purchaseSummary, valuation, walletSummary] = await Promise.all([
      financialDashboardService.getDashboardTotals(),
      salesReportsService.getSalesSummary({ dateFrom: startOfMonth }),
      purchaseReportsService.getPurchaseSummary({ dateFrom: startOfMonth }),
      inventoryReportsService.getInventoryValuation({ page: 1, limit: 1 }),
      customerReportsService.getWalletSummary(),
    ]);

    return {
      revenue: financial.revenue,
      profit: financial.profit,
      expenses: financial.expenses,
      sales: salesSummary.orderCount,
      purchases: purchaseSummary.totalValue,
      inventoryValue: valuation.grandTotal,
      outstandingReceivables: financial.receivables,
      outstandingPayables: financial.payables,
      walletBalance: walletSummary.totalBalance,
    };
  },

  async getDashboardCharts({ days = 14 } = {}) {
    const [salesTrend, purchaseTrend, cashFlow, profitTrend, topCategories, topProducts] = await Promise.all([
      orderService.getSalesTrend(days),
      purchaseOrderService.getPurchaseTrend(days),
      financialDashboardService.getCashFlowTrend(days),
      financialDashboardService.getProfitTrend(days),
      salesReportsService.getSalesByCategory({ page: 1, limit: 8 }),
      salesReportsService.getSalesByProduct({ page: 1, limit: 8 }),
    ]);

    return {
      salesTrend,
      purchaseTrend,
      cashFlow,
      profitTrend,
      topCategories: topCategories.items,
      topProducts: topProducts.items,
    };
  },
};
