import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { REPORT_DOMAINS } from './reportRegistry';
import { DomainReportsTab } from './DomainReportsTab';

export default function ReportsCenterPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Reports Center</h1>
          <p className="text-sm text-muted-foreground">Every report, read-only, straight from the modules that own the data.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/accounting/reports')}>
          <ExternalLink className="size-4" /> Financial Reports
        </Button>
      </div>

      <Tabs defaultValue={REPORT_DOMAINS[0].key}>
        <TabsList className="flex-wrap">
          {REPORT_DOMAINS.map((domain) => (
            <TabsTrigger key={domain.key} value={domain.key}>{domain.label}</TabsTrigger>
          ))}
        </TabsList>
        {REPORT_DOMAINS.map((domain) => (
          <TabsContent key={domain.key} value={domain.key} className="pt-4">
            <DomainReportsTab reports={domain.reports} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
