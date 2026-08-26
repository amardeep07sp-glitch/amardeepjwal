import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/global/FormField';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { useSettings, useUpdateSettings } from './settingsApi';
import { settingsSchema, settingsFormDefaults, HEADING_FONT_OPTIONS, BODY_FONT_OPTIONS } from './settingsSchema';

// Preview-only lookup (real CSS font-family strings) - the form itself
// only ever stores/submits the short key (e.g. 'cormorant-garamond'), the
// same contract backend/src/constants/typography.js and client/src/config/
// typography.js both share. Admin's own UI never uses these fonts outside
// this one preview box (see index.css's header comment on the imports).
const FONT_FAMILY_CSS = {
  'playfair-display': "'Playfair Display', serif",
  'cormorant-garamond': "'Cormorant Garamond', serif",
  inter: "'Inter Variable', sans-serif",
  poppins: "'Poppins', sans-serif",
};

export default function SettingsPage() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(settingsSchema), defaultValues: settingsFormDefaults });

  const previewHeadingFont = watch('typography.headingFont');
  const previewBodyFont = watch('typography.bodyFont');

  useEffect(() => {
    if (settings) {
      reset({ ...settingsFormDefaults, ...settings });
    }
  }, [settings, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      logoMedia: toMediaIdForSubmit(values.logoMedia),
      faviconMedia: toMediaIdForSubmit(values.faviconMedia),
      seoDefaults: { ...values.seoDefaults, ogImageMedia: toMediaIdForSubmit(values.seoDefaults?.ogImageMedia) },
    };
    try {
      await updateSettings.mutateAsync(payload);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading settings..." />;
  if (error) {
    return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Settings</h1>
          <p className="text-sm text-muted-foreground">Site-wide details used across the storefront.</p>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Site name" htmlFor="siteName" required error={errors.siteName?.message}>
            <Input id="siteName" {...register('siteName')} />
          </FormField>
          <FormField label="Tagline" htmlFor="siteTagline">
            <Input id="siteTagline" {...register('siteTagline')} />
          </FormField>
          <FormField label="Logo">
            <Controller
              name="logoMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker value={field.value} onChange={field.onChange} entityType="settings" entityId={settings?.id} />
              )}
            />
          </FormField>
          <FormField label="Favicon">
            <Controller
              name="faviconMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker value={field.value} onChange={field.onChange} entityType="settings" entityId={settings?.id} />
              )}
            />
          </FormField>
          <FormField label="Currency" htmlFor="currency">
            <Input id="currency" {...register('currency')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Changes the storefront's fonts everywhere - hero headings, section titles and product names use the heading
            font; body copy, buttons and prices use the body font. Both are curated, already-bundled fonts (no live
            Google Fonts lookup), so there's no broken-typography risk from a bad value.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Heading font" htmlFor="typography.headingFont">
              <Controller
                name="typography.headingFont"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="typography.headingFont" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HEADING_FONT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Body font" htmlFor="typography.bodyFont">
              <Controller
                name="typography.bodyFont"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="typography.bodyFont" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BODY_FONT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-5">
            <p
              className="text-2xl font-bold text-heading"
              style={{ fontFamily: FONT_FAMILY_CSS[previewHeadingFont] }}
            >
              Timeless Gold Jewellery
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground" style={{ fontFamily: FONT_FAMILY_CSS[previewBodyFont] }}>
              This is how body copy, product descriptions and prices will read on the storefront.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contact email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
            <Input id="contactEmail" type="email" {...register('contactEmail')} />
          </FormField>
          <FormField label="Contact phone" htmlFor="contactPhone">
            <Input id="contactPhone" {...register('contactPhone')} />
          </FormField>
          <FormField label="WhatsApp number" htmlFor="whatsappNumber">
            <Input id="whatsappNumber" {...register('whatsappNumber')} />
          </FormField>
          <FormField label="Address" htmlFor="address" className="sm:col-span-2">
            <Textarea id="address" rows={2} {...register('address')} />
          </FormField>
          <FormField label="Footer copyright text" htmlFor="footerCopyrightText" className="sm:col-span-2">
            <Input id="footerCopyrightText" {...register('footerCopyrightText')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Facebook" htmlFor="socialLinks.facebook">
            <Input id="socialLinks.facebook" {...register('socialLinks.facebook')} />
          </FormField>
          <FormField label="Instagram" htmlFor="socialLinks.instagram">
            <Input id="socialLinks.instagram" {...register('socialLinks.instagram')} />
          </FormField>
          <FormField label="Twitter / X" htmlFor="socialLinks.twitter">
            <Input id="socialLinks.twitter" {...register('socialLinks.twitter')} />
          </FormField>
          <FormField label="YouTube" htmlFor="socialLinks.youtube">
            <Input id="socialLinks.youtube" {...register('socialLinks.youtube')} />
          </FormField>
          <FormField label="Pinterest" htmlFor="socialLinks.pinterest">
            <Input id="socialLinks.pinterest" {...register('socialLinks.pinterest')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default SEO</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Meta title" htmlFor="seoDefaults.metaTitle">
            <Input id="seoDefaults.metaTitle" {...register('seoDefaults.metaTitle')} />
          </FormField>
          <FormField label="OG image">
            <Controller
              name="seoDefaults.ogImageMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker value={field.value} onChange={field.onChange} entityType="settings" entityId={settings?.id} />
              )}
            />
          </FormField>
          <FormField label="Meta description" htmlFor="seoDefaults.metaDescription" className="sm:col-span-2">
            <Textarea id="seoDefaults.metaDescription" rows={2} {...register('seoDefaults.metaDescription')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Printed as the "Sold By" block on every customer invoice. A field left blank is simply omitted from the PDF
            rather than shown as a placeholder.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Legal business name" htmlFor="legalBusinessName" description="Falls back to Site Name if left blank">
              <Input id="legalBusinessName" {...register('legalBusinessName')} />
            </FormField>
            <FormField label="GSTIN" htmlFor="gstin">
              <Input id="gstin" className="uppercase" {...register('gstin')} />
            </FormField>
            <FormField label="PAN" htmlFor="panNumber">
              <Input id="panNumber" className="uppercase" {...register('panNumber')} />
            </FormField>
          </div>

          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Registered Address</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Address line 1" htmlFor="registeredAddress.line1">
              <Input id="registeredAddress.line1" {...register('registeredAddress.line1')} />
            </FormField>
            <FormField label="Address line 2" htmlFor="registeredAddress.line2">
              <Input id="registeredAddress.line2" {...register('registeredAddress.line2')} />
            </FormField>
            <FormField label="City" htmlFor="registeredAddress.city">
              <Input id="registeredAddress.city" {...register('registeredAddress.city')} />
            </FormField>
            <FormField label="State" htmlFor="registeredAddress.state" description="Drives the CGST+SGST vs IGST split on invoices">
              <Input id="registeredAddress.state" {...register('registeredAddress.state')} />
            </FormField>
            <FormField label="Postal code" htmlFor="registeredAddress.postalCode">
              <Input id="registeredAddress.postalCode" {...register('registeredAddress.postalCode')} />
            </FormField>
            <FormField label="Country" htmlFor="registeredAddress.country">
              <Input id="registeredAddress.country" {...register('registeredAddress.country')} />
            </FormField>
          </div>

          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bank Details (for bank transfer)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Account holder name" htmlFor="bankDetails.accountHolderName">
              <Input id="bankDetails.accountHolderName" {...register('bankDetails.accountHolderName')} />
            </FormField>
            <FormField label="Bank name" htmlFor="bankDetails.bankName">
              <Input id="bankDetails.bankName" {...register('bankDetails.bankName')} />
            </FormField>
            <FormField label="Account number" htmlFor="bankDetails.accountNumber">
              <Input id="bankDetails.accountNumber" {...register('bankDetails.accountNumber')} />
            </FormField>
            <FormField label="IFSC code" htmlFor="bankDetails.ifscCode">
              <Input id="bankDetails.ifscCode" className="uppercase" {...register('bankDetails.ifscCode')} />
            </FormField>
            <FormField label="Branch" htmlFor="bankDetails.branch">
              <Input id="bankDetails.branch" {...register('bankDetails.branch')} />
            </FormField>
          </div>

          <FormField label="Terms & conditions" htmlFor="invoiceTerms" description="Printed at the bottom of every invoice">
            <Textarea id="invoiceTerms" rows={3} {...register('invoiceTerms')} />
          </FormField>
        </CardContent>
      </Card>
    </form>
  );
}
