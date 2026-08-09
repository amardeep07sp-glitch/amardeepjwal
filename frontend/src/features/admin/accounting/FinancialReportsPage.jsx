import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useTrialBalance } from './generalLedgerApi';
import { useProfitAndLoss, useBalanceSheet, useCashBook, useDayBook } from './financialReportsApi';
import { TaxRatesTab } from './TaxRatesTab';

function TrialBalanceTab() {
  const [asOfDate, setAsOfDate] = useState('');
  const { data } = useTrialBalance({ asOfDate: asOfDate || undefined });

  return (
    <div className="flex flex-col gap-4">
      <FormField label="As of date" className="w-48">
        <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
      </FormField>
      {!data ? null : (
        <>
          <Badge variant={data.isBalanced ? 'success' : 'destructive'}>{data.isBalanced ? 'Balanced' : 'Out of balance'}</Badge>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.filter((r) => r.debit !== 0 || r.credit !== 0).map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{row.code}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-right">{row.debit > 0 ? row.debit.toFixed(2) : ''}</td>
                    <td className="px-3 py-2 text-right">{row.credit > 0 ? row.credit.toFixed(2) : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-heading">
                  <td className="px-3 py-2" colSpan={2}>Total</td>
                  <td className="px-3 py-2 text-right">{data.totalDebit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{data.totalCredit.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProfitAndLossTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data } = useProfitAndLoss({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <FormField label="From"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></FormField>
        <FormField label="To"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></FormField>
      </div>
      {!data ? null : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Income</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              {data.income.length === 0 && <p className="text-muted-foreground">No income recorded.</p>}
              {data.income.map((row) => (
                <div key={row.id} className="flex justify-between"><span>{row.name}</span><span>₹{row.amount.toFixed(2)}</span></div>
              ))}
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-heading"><span>Total Income</span><span>₹{data.totalIncome.toFixed(2)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Expense</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              {data.expense.length === 0 && <p className="text-muted-foreground">No expense recorded.</p>}
              {data.expense.map((row) => (
                <div key={row.id} className="flex justify-between"><span>{row.name}</span><span>₹{row.amount.toFixed(2)}</span></div>
              ))}
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-heading"><span>Total Expense</span><span>₹{data.totalExpense.toFixed(2)}</span></div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="flex justify-between text-base font-semibold text-heading">
              <span>Net Profit</span>
              <span className={data.netProfit >= 0 ? 'text-success' : 'text-destructive'}>₹{data.netProfit.toFixed(2)}</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function BalanceSheetTab() {
  const [asOfDate, setAsOfDate] = useState('');
  const { data } = useBalanceSheet({ asOfDate: asOfDate || undefined });

  const Section = ({ title, rows, total }) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {rows.length === 0 && <p className="text-muted-foreground">Nothing to show.</p>}
        {rows.map((row) => (
          <div key={row.id ?? row.name} className="flex justify-between"><span>{row.name}</span><span>₹{row.balance.toFixed(2)}</span></div>
        ))}
        <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-heading"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <FormField label="As of date" className="w-48">
        <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
      </FormField>
      {!data ? null : (
        <>
          <Badge variant={data.isBalanced ? 'success' : 'destructive'}>{data.isBalanced ? 'Balanced' : 'Out of balance'}</Badge>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Section title="Assets" rows={data.assets} total={data.totalAssets} />
            <Section title="Liabilities" rows={data.liabilities} total={data.totalLiabilities} />
            <Section title="Equity" rows={data.equity} total={data.totalEquity} />
          </div>
        </>
      )}
    </div>
  );
}

function CashBookTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data } = useCashBook({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <FormField label="From"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></FormField>
        <FormField label="To"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></FormField>
      </div>
      {!data ? null : data.lines.length === 0 ? (
        <EmptyState title="No cash/bank activity" description="Nothing posted in this range." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Narration</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Credit</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(line.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{line.accountName}</td>
                  <td className="px-3 py-2">{line.narration || line.journal?.narration}</td>
                  <td className="px-3 py-2 text-right">{line.debit > 0 ? line.debit.toFixed(2) : ''}</td>
                  <td className="px-3 py-2 text-right">{line.credit > 0 ? line.credit.toFixed(2) : ''}</td>
                  <td className="px-3 py-2 text-right font-medium">{line.runningBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DayBookTab() {
  const [date, setDate] = useState('');
  const { data } = useDayBook({ date: date || undefined });

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Date" className="w-48">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormField>
      {!data ? null : data.entries.length === 0 ? (
        <EmptyState title="No journals on this day" description="Every posted journal for the selected date appears here." />
      ) : (
        <div className="flex flex-col gap-3">
          {data.entries.map(({ journal, lines }) => (
            <Card key={journal.id} size="sm">
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-heading">{journal.journalNumber} · {journal.narration}</span>
                  <span>₹{journal.totalAmount.toFixed(2)}</span>
                </div>
                {lines.map((l) => (
                  <div key={l._id} className="flex justify-between pl-3 text-muted-foreground">
                    <span>{l.account?.code} - {l.account?.name}</span>
                    <span>{l.debit > 0 ? `Dr ${l.debit.toFixed(2)}` : `Cr ${l.credit.toFixed(2)}`}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Trial Balance, P&L, Balance Sheet, Cash Book, Day Book, and Tax Summary.</p>
      </div>

      <Tabs defaultValue="trial-balance">
        <TabsList className="flex-wrap">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-book">Cash Book</TabsTrigger>
          <TabsTrigger value="day-book">Day Book</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="trial-balance" className="pt-4"><TrialBalanceTab /></TabsContent>
        <TabsContent value="pnl" className="pt-4"><ProfitAndLossTab /></TabsContent>
        <TabsContent value="balance-sheet" className="pt-4"><BalanceSheetTab /></TabsContent>
        <TabsContent value="cash-book" className="pt-4"><CashBookTab /></TabsContent>
        <TabsContent value="day-book" className="pt-4"><DayBookTab /></TabsContent>
        <TabsContent value="tax" className="pt-4"><TaxRatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
