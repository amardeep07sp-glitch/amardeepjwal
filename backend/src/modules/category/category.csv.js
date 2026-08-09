import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

// Export columns are display-oriented (parent slug, not a raw ObjectId)
// since this file is meant to be opened in a spreadsheet by a human, not
// round-tripped byte-for-byte - see inventory.csv.js for the same convention.
const EXPORT_COLUMNS = [
  'name',
  'slug',
  'parentSlug',
  'description',
  'shortDescription',
  'skuPrefix',
  'status',
  'isFeatured',
  'showInNavbar',
  'showOnHomepage',
  'isVisible',
  'order',
  'metaTitle',
  'metaDescription',
  'metaKeywords',
];

export const buildCategoryCsv = (categories) => {
  const rows = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    parentSlug: category.parent?.slug ?? '',
    description: category.description ?? '',
    shortDescription: category.shortDescription ?? '',
    skuPrefix: category.skuPrefix ?? '',
    status: category.status,
    isFeatured: category.isFeatured,
    showInNavbar: category.showInNavbar,
    showOnHomepage: category.showOnHomepage,
    isVisible: category.isVisible,
    order: category.order,
    metaTitle: category.seo?.metaTitle ?? '',
    metaDescription: category.seo?.metaDescription ?? '',
    metaKeywords: category.seo?.metaKeywords ?? '',
  }));

  return stringify(rows, { header: true, columns: EXPORT_COLUMNS });
};

const parseBoolean = (value) => (value === undefined || value === '' ? undefined : value === 'true');
const parseOptionalNumber = (value) => (value === undefined || value === '' ? undefined : Number(value));

// Row order matters for hierarchy: a row whose parentSlug hasn't been
// created yet (in this file or already in the database) is reported as an
// error rather than silently dropped - see categoryService.importCategoriesCsv,
// which processes rows in file order so a parent listed before its children
// resolves in a single pass.
export const parseCategoryCsv = (buffer) => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => ({
    name: row.name,
    slug: row.slug || undefined,
    parentSlug: row.parentSlug || undefined,
    description: row.description,
    shortDescription: row.shortDescription,
    skuPrefix: row.skuPrefix,
    status: row.status || undefined,
    isFeatured: parseBoolean(row.isFeatured),
    showInNavbar: parseBoolean(row.showInNavbar),
    showOnHomepage: parseBoolean(row.showOnHomepage),
    isVisible: parseBoolean(row.isVisible),
    order: parseOptionalNumber(row.order),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    metaKeywords: row.metaKeywords,
  }));
};
