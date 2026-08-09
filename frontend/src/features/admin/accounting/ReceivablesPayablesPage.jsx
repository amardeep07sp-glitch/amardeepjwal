import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/global/EmptyState';
import { useReceivablesOutstanding, useReceivablesAging } from './receivablesApi';
import { usePayablesOutstanding, usePayablesAging } from './payablesApi';

const AGING_COLUMNS = [
  { key: 'current', label: '0-30 days' },
  { key: 'days31To60', label: '31-60 days' },
  { key: 'days61To90', label: '61-90 days' },
  { key: 'days90Plus', label: '90+ days' },
];

function OutstandingTable({ rows, nameKey, codeKey }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title="Nothing outstanding" description="Every balance is settled." />;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-3 py-2">{row[nameKey]}</td>
              <td className="px-3 py-2 text-muted-foreground">{row[codeKey]}</td>
              <td className="px-3 py-2 text-right font-medium">
                ₹{Math.abs(row.balance).toFixed(2)} {row.isCredit && <Badge variant="secondary" className="ml-1">Credit</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgingTable({ rows, nameKey, codeKey }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title="Nothing to age" description="No open balances found." />;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
            <th className="px-3 py-2">Name</th>
            {AGING_COLUMNS.map((c) => (
              <th key={c.key} className="px-3 py-2 text-right">{c.label}</th>
            ))}
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-3 py-2">
                {row[nameKey]}
                <span className="ml-1 text-xs text-muted-foreground">{row[codeKey]}</span>
              </td>
              {AGING_COLUMNS.map((c) => (
                <td key={c.key} className={`px-3 py-2 text-right ${row.buckets[c.key] > 0 && c.key !== 'current' ? 'text-warning' : ''}`}>
                  {row.buckets[c.key] > 0 ? `₹${row.buckets[c.key].toFixed(2)}` : '—'}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold text-heading">₹{row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceivablesTab() {
  const { data: outstanding } = useReceivablesOutstanding();
  const { data: aging } = useReceivablesAging();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Outstanding by customer</CardTitle></CardHeader>
        <CardContent><OutstandingTable rows={outstanding} nameKey="customerName" codeKey="customerCode" /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Aging</CardTitle></CardHeader>
        <CardContent><AgingTable rows={aging} nameKey="customerName" codeKey="customerCode" /></CardContent>
      </Card>
    </div>
  );
}

function PayablesTab() {
  const { data: outstanding } = usePayablesOutstanding();
  const { data: aging } = usePayablesAging();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Outstanding by supplier</CardTitle></CardHeader>
        <CardContent><OutstandingTable rows={outstanding} nameKey="supplierName" codeKey="supplierCode" /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Aging</CardTitle></CardHeader>
        <CardContent><AgingTable rows={aging} nameKey="supplierName" codeKey="supplierCode" /></CardContent>
      </Card>
    </div>
  );
}

export default function ReceivablesPayablesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Receivables & Payables</h1>
        <p className="text-sm text-muted-foreground">Who owes us, who we owe, and for how long it's been outstanding.</p>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
        </TabsList>
        <TabsContent value="receivables" className="pt-4">
          <ReceivablesTab />
        </TabsContent>
        <TabsContent value="payables" className="pt-4">
          <PayablesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
