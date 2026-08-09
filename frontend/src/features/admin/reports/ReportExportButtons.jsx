import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/downloadFile';

// CSV/Excel/PDF all funnel through the backend's generic export.util.js
// (see export.util.js#sendReportExport) - this component just builds the
// query string for whichever format was clicked. "Print" is deliberately
// NOT a server round-trip - it prints the on-screen table via the browser's
// own print dialog, the same way every real print pipeline works.
export function ReportExportButtons({ endpoint, params, reportKey }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams({ ...params, format }).toString();
      const ext = format === 'excel' ? 'xlsx' : format;
      await downloadFile(`${endpoint}?${query}`, { filename: `${reportKey}.${ext}` });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
        <Download className="size-3.5" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={isExporting}>
        <Download className="size-3.5" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
        <Download className="size-3.5" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-3.5" /> Print
      </Button>
    </div>
  );
}
