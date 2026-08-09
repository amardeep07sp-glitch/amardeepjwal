import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DomainReportsTab } from '@/features/admin/reports/DomainReportsTab';
import { CIP_REPORT_DOMAINS } from './cipReportRegistry';

// Reuses Phase 11's Reports Center machinery verbatim (DomainReportsTab
// already handles the report picker, date-range filters, and adaptive
// result rendering generically) - CIP only supplies its own registry.
export default function CipReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">CIP Reports</h1>
        <p className="text-sm text-muted-foreground">Every visitor, session, search, and journey the storefront reports - read-only.</p>
      </div>

      <Tabs defaultValue={CIP_REPORT_DOMAINS[0].key}>
        <TabsList className="flex-wrap">
          {CIP_REPORT_DOMAINS.map((domain) => (
            <TabsTrigger key={domain.key} value={domain.key}>{domain.label}</TabsTrigger>
          ))}
        </TabsList>
        {CIP_REPORT_DOMAINS.map((domain) => (
          <TabsContent key={domain.key} value={domain.key} className="pt-4">
            <DomainReportsTab reports={domain.reports} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
