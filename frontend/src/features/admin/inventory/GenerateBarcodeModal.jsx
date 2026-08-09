import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '../catalog/products/productsApi';
import { useGenerateBarcode } from './barcodesApi';

const BARCODE_TYPES = [
  { value: 'code128', label: 'Code128' },
  { value: 'code39', label: 'Code39' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upc', label: 'UPC' },
  { value: 'qr', label: 'QR Code' },
];

export function GenerateBarcodeModal({ open, onOpenChange }) {
  const [productId, setProductId] = useState('');
  const [barcodeType, setBarcodeType] = useState('code128');
  const { data: productsData } = useProducts({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const generateBarcode = useGenerateBarcode();

  const products = productsData?.items ?? [];

  const handleGenerate = async () => {
    if (!productId) {
      toast.error('Select a product first');
      return;
    }
    try {
      await generateBarcode.mutateAsync({ productId, variantId: null, barcodeType });
      toast.success('Barcode generated successfully');
      setProductId('');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Generate barcode"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={generateBarcode.isPending}>
            {generateBarcode.isPending ? 'Generating...' : 'Generate'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Product" required>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Barcode type" required>
          <Select value={barcodeType} onValueChange={setBarcodeType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BARCODE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}
