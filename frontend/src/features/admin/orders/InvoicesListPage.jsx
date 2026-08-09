import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { downloadFile } from '@/lib/downloadFile';
import { useInvoices } from './invoicesApi';

const PAYMENT_STATUS_VARIANT = { paid: 'success', pending: 'warning', partially_paid: 'warning', refunded: 'destructive' };
const TAX_TYPE_LABEL = { intra_state: 'CGST + SGST', inter_state: 'IGST', unknown: '-' };

const formatCurrency = (value) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function InvoicesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  const { data, isLoading, error, refetch } = useInvoices({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
  });

  const invoices = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      await downloadFile(`/invoices/order/${invoice.order.id}/download`, { filename: `${invoice.invoiceNumber}.pdf` });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (inv) => <span className="font-mono text-sm font-semibold text-heading">{inv.invoiceNumber}</span> },
    {
      key: 'order',
      header: 'Order',
      render: (inv) => (
        <Link to={`/admin/orders/${inv.order.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
          {inv.order.orderNumber} <ExternalLink className="size-3" />
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (inv) => inv.order.customerName || '-' },
    { key: 'date', header: 'Invoice Date', render: (inv) => formatDate(inv.invoiceDate) },
    { key: 'taxType', header: 'Tax Type', render: (inv) => TAX_TYPE_LABEL[inv.taxSummary?.taxType] ?? '-' },
    { key: 'amount', header: 'Amount', render: (inv) => formatCurrency(inv.order.grandTotal) },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (inv) => (
        <Badge variant={PAYMENT_STATUS_VARIANT[inv.order.paymentStatus] ?? 'secondary'} className="capitalize">
          {inv.order.paymentStatus?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (inv) => (
        <Button variant="ghost" size="sm" disabled={downloadingId === inv.id} onClick={() => handleDownload(inv)}>
          <Download className="size-3.5" /> {downloadingId === inv.id ? 'Downloading...' : 'Download'}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Invoices</h1>
          <p className="text-sm text-muted-foreground">Every tax invoice ever issued, minted the first time an order's invoice is downloaded.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        rowKey={(inv) => inv.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by invoice # or order #..."
        emptyTitle="No invoices yet"
        emptyDescription="An invoice is created automatically the first time it's downloaded, from an order's detail page."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
