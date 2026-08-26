import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/global/FormField';
import { useReportQuery } from './reportsApi';
import { ReportResultView } from './ReportResultView';
import { ReportExportButtons } from './ReportExportButtons';

const DEFAULT_LIMIT = 20;

// One generic tab implementation reused by every domain (Sales/Purchase/
// Inventory/Customers/Suppliers/Tax/Activity) - each just passes its own
// slice of the report registry. Renders the report picker, the shared
// date-range Filter Engine controls, the adaptive result view, and export
// buttons (only for reports the registry marks exportable).
export function DomainReportsTab({ reports }) {
  const [reportKey, setReportKey] = useState(reports[0]?.key);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [groupBy, setGroupBy] = useState('');

  const report = reports.find((r) => r.key === reportKey) ?? reports[0];

  useEffect(() => {
    setPage(1);
    setGroupBy(report?.groupByOptions?.[0]?.value ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey, dateFrom, dateTo]);

  const params = {
    ...(report.dateRange && dateFrom ? { dateFrom } : {}),
    ...(report.dateRange && dateTo ? { dateTo } : {}),
    ...(report.groupByOptions && groupBy ? { groupBy } : {}),
    ...(report.shape === 'paginated' ? { page, limit: DEFAULT_LIMIT } : {}),
  };

  const { data, isLoading, error } = useReportQuery(report.endpoint, params);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <FormField label="Report" className="w-64">
          <Select value={reportKey} onValueChange={setReportKey}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {reports.map((r) => (
                <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        {report.dateRange && (
          <>
            <FormField label="From">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </FormField>
            <FormField label="To">
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </FormField>
          </>
        )}
        {report.groupByOptions && (
          <FormField label="Group by" className="w-32">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {report.groupByOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
        {report.exportable && <ReportExportButtons endpoint={report.endpoint} params={params} reportKey={report.key} />}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : (
        <ReportResultView shape={report.shape} data={data} columns={report.columns} page={page} onPageChange={setPage} />
      )}
    </div>
  );
}
