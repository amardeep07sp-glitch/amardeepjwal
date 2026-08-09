import { useRef, useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesTableView } from './CategoriesTableView';
import { CategoriesTreeView } from './CategoriesTreeView';
import { CategoriesTrashView } from './CategoriesTrashView';
import { CategoriesActivityView } from './CategoriesActivityView';
import { CategoriesAnalyticsView } from './CategoriesAnalyticsView';
import { CategoryFormModal } from './CategoryFormModal';
import { CategoryPreviewDrawer } from './CategoryPreviewDrawer';
import { exportCategoriesCsv, useImportCategories } from './categoriesApi';

export default function CategoriesListPage() {
  const [formModalState, setFormModalState] = useState({ open: false, category: null });
  const [previewCategory, setPreviewCategory] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const importFileInputRef = useRef(null);
  const importCategories = useImportCategories();

  const openCreateModal = () => setFormModalState({ open: true, category: null });
  const openEditModal = (category) => setFormModalState({ open: true, category });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCategoriesCsv();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const { data: result } = await importCategories.mutateAsync(file);
      toast.success(`Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} row(s) had issues — first: ${result.errors[0].message}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize products into an unlimited-depth category hierarchy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFileSelected}
          />
          <Button variant="outline" onClick={() => importFileInputRef.current?.click()} disabled={importCategories.isPending}>
            <Upload />
            {importCategories.isPending ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={openCreateModal}>
            <Plus />
            New category
          </Button>
        </div>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table view</TabsTrigger>
          <TabsTrigger value="tree">Tree view</TabsTrigger>
          <TabsTrigger value="trash">Trash</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <CategoriesTableView onEdit={openEditModal} onPreview={setPreviewCategory} />
        </TabsContent>

        <TabsContent value="tree">
          <CategoriesTreeView onEdit={openEditModal} onPreview={setPreviewCategory} />
        </TabsContent>

        <TabsContent value="trash">
          <CategoriesTrashView />
        </TabsContent>

        <TabsContent value="activity">
          <CategoriesActivityView />
        </TabsContent>

        <TabsContent value="analytics">
          <CategoriesAnalyticsView />
        </TabsContent>
      </Tabs>

      <CategoryFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, category: open ? formModalState.category : null })}
        category={formModalState.category}
      />

      <CategoryPreviewDrawer
        open={Boolean(previewCategory)}
        onOpenChange={(open) => !open && setPreviewCategory(null)}
        category={previewCategory}
      />
    </div>
  );
}
