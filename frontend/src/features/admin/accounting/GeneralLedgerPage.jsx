import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useAllAccounts } from './accountsApi';
import { useAccountLedger } from './generalLedgerApi';

export default function GeneralLedgerPage() {
  const [searchParams] = useSearchParams();
  const [accountId, setAccountId] = useState(searchParams.get('account') ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: accounts } = useAllAccounts();
  const { data: ledger, isLoading } = useAccountLedger(accountId, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">General Ledger</h1>
        <p className="text-sm text-muted-foreground">Every posting against a single account, with a running balance.</p>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-4">
          <FormField label="Account" className="w-64">
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="From">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </FormField>
          <FormField label="To">
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      {!accountId ? (
        <EmptyState title="Select an account" description="Choose an account above to see its ledger." />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading ledger...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{ledger?.account?.code} - {ledger?.account?.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Opening balance: ₹{ledger?.openingBalance.toFixed(2)}</span>
              <span>Closing balance: ₹{ledger?.closingBalance.toFixed(2)}</span>
            </div>
            {ledger?.lines.length === 0 ? (
              <EmptyState title="No activity in this range" description="Try widening the date filter." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Journal</th>
                      <th className="px-3 py-2">Narration</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger?.lines.map((line) => (
                      <tr key={line.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{new Date(line.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{line.journal?.journalNumber}</td>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
