import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/global/EmptyState';

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString('en-IN') : value.toFixed(2);
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString();
  return String(value);
};

const humanizeKey = (key) => key.replace(/^_/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

function inferColumns(rows) {
  if (!rows?.length) return [];
  return Object.keys(rows[0])
    .filter((k) => k !== 'id' && !k.endsWith('Id'))
    .map((key) => ({ key, header: humanizeKey(key) }));
}

function ReportTable({ rows, columns }) {
  const cols = columns?.length ? columns : inferColumns(rows);
  if (!rows?.length) return <EmptyState title="No data" description="Nothing matches the current filters." />;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-border last:border-0">
              {cols.map((c) => (
                <td key={c.key} className="px-3 py-2">{formatCell(row[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCardGrid({ data }) {
  const entries = Object.entries(data ?? {});
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(([key, value]) => (
        <Card key={key} size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{humanizeKey(key)}</p>
            <p className="text-xl font-semibold text-heading">{formatCell(value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Adaptively renders whatever shape a report returns - 'object' (summary
// cards), 'array' (plain table), 'paginated' (table + page controls,
// tolerant of either a proper {meta} or a raw repository {total}), or
// 'liability' (Tax Liability's one compound {liability, breakdown} shape).
export function ReportResultView({ shape, data, columns, page, onPageChange }) {
  if (!data) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (shape === 'object') return <StatCardGrid data={data} />;

  if (shape === 'liability') {
    return (
      <div className="flex flex-col gap-4">
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Net Tax Liability</p>
            <p className={`text-2xl font-semibold ${data.liability >= 0 ? 'text-warning' : 'text-success'}`}>
              ₹{Math.abs(data.liability).toFixed(2)} {data.liability < 0 ? '(credit carried forward)' : '(payable)'}
            </p>
          </CardContent>
        </Card>
        <ReportTable rows={data.breakdown} columns={columns} />
      </div>
    );
  }

  if (shape === 'array') {
    const rows = Array.isArray(data) ? data : data.items ?? [];
    return <ReportTable rows={rows} columns={columns} />;
  }

  // 'paginated'
  const rows = data.items ?? [];
  const limit = data.meta?.limit ?? rows.length ?? 20;
  const totalPages = data.meta?.totalPages ?? Math.max(1, Math.ceil((data.total ?? rows.length) / (limit || 1)));
  const totalItems = data.meta?.totalItems ?? data.total ?? rows.length;

  return (
    <div className="flex flex-col gap-3">
      <ReportTable rows={rows} columns={columns} />
      {data.grandTotal !== undefined && (
        <div className="flex justify-end text-sm font-semibold text-heading">Grand Total: ₹{data.grandTotal.toFixed(2)}</div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalItems} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
