import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { usePublicSettings } from '@/features/settings/settingsApi';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeo } from '@/hooks/useSeo';
import { APP_NAME, APP_ALTERNATE_NAME, SITE_URL, STORE_LOCALITY, STORE_DISTRICT } from '@/config/appConfig';

// Real business contact details only (settings.serializer.js#
// serializePublicSettings) - a field the store hasn't filled in yet
// (e.g. no WhatsApp number configured) is simply omitted, not shown as a
// placeholder or a fake "coming soon". No "Send us a message" form here
// either - there's no backend to receive/store a submission, so a mailto:/
// tel: link (real, functional right now) beats a form that goes nowhere.
export default function ContactPage() {
  const { data: settings, isLoading } = usePublicSettings();

  useSeo({
    title: `Contact Us | ${APP_NAME}`,
    description: `Get in touch with ${APP_NAME} (${APP_ALTERNATE_NAME}) in ${STORE_LOCALITY}, ${STORE_DISTRICT} - call, WhatsApp, email, or visit our store.`,
    canonical: `${SITE_URL}/contact`,
  });

  const contactRows = settings
    ? [
        settings.contactPhone && { icon: Phone, label: 'Call Us', value: settings.contactPhone, href: `tel:${settings.contactPhone}` },
        settings.whatsappNumber && {
          icon: MessageCircle,
          label: 'WhatsApp',
          value: settings.whatsappNumber,
          href: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`,
        },
        settings.contactEmail && { icon: Mail, label: 'Email Us', value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
        settings.address && { icon: MapPin, label: 'Visit Us', value: settings.address, href: null },
      ].filter(Boolean)
    : [];

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />
      </div>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-h3 font-display font-bold text-heading sm:text-h2">Contact Us</h1>
        <p className="mb-6 text-sm text-muted-foreground">We'd love to hear from you - reach out through any of the ways below.</p>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : contactRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Contact details for {APP_NAME} are being updated - please check back soon.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {contactRows.map((row) => {
              const Content = (
                <div className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-border transition-colors hover:border-primary/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <row.icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="truncate text-sm font-medium text-heading">{row.value}</p>
                  </div>
                </div>
              );
              return row.href ? (
                <a key={row.label} href={row.href} target={row.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  {Content}
                </a>
              ) : (
                <div key={row.label}>{Content}</div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
