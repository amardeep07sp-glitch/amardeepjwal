import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '../catalog/products/productsApi';
import { useAllWarehouses } from '../inventory/warehousesApi';
import { SupplierPickerSelect } from '../suppliers/SupplierPickerSelect';
import { useCreatePurchaseOrder } from './purchaseOrdersApi';

export function NewPurchaseOrderModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [items, setItems] = useState([]);
  const [productToAdd, setProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('1');
  const [unitCostToAdd, setUnitCostToAdd] = useState('');

  const { data: productsData } = useProducts({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: warehousesData } = useAllWarehouses();
  const createPurchaseOrder = useCreatePurchaseOrder();

  const products = productsData?.items ?? [];
  const warehouses = warehousesData ?? [];

  const reset = () => {
    setSupplier('');
    setWarehouse('');
    setShippingCharge('0');
    setExpectedDeliveryDate('');
    setInternalNotes('');
    setItems([]);
    setProductToAdd('');
    setQuantityToAdd('1');
    setUnitCostToAdd('');
  };

  const addItem = () => {
    const product = products.find((p) => p.id === productToAdd);
    if (!product) {
      toast.error('Select a product first');
      return;
    }
    if (!unitCostToAdd || Number(unitCostToAdd) < 0) {
      toast.error('Enter a unit cost');
      return;
    }
    setItems((prev) => [
      ...prev,
      { product: product.id, sku: product.sku, name: product.name, quantity: Number(quantityToAdd) || 1, unitCost: Number(unitCostToAdd) },
    ]);
    setProductToAdd('');
    setQuantityToAdd('1');
    setUnitCostToAdd('');
  };

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  const grandTotal = subtotal + (Number(shippingCharge) || 0);

  const handleSubmit = async () => {
    if (!supplier) {
      toast.error('Select a supplier');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one line item');
      return;
    }
    try {
      const { data: po } = await createPurchaseOrder.mutateAsync({
        supplier,
        warehouse: warehouse || undefined,
        shippingCharge: Number(shippingCharge) || 0,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        internalNotes,
        items: items.map((i) => ({ product: i.product, quantity: i.quantity, unitCost: i.unitCost })),
      });
      toast.success(`Purchase order ${po.poNumber} created`);
      reset();
      onOpenChange(false);
      navigate(`/admin/purchase-orders/${po.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New purchase order"
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createPurchaseOrder.isPending}>
            {createPurchaseOrder.isPending ? 'Creating...' : 'Create purchase order'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
        <FormField label="Supplier" required>
          <SupplierPickerSelect value={supplier} onChange={setSupplier} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Warehouse" description="Defaults to the Default Warehouse if left unset">
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Default Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Expected delivery date">
            <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
          </FormField>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium text-heading">Line items</p>

          <div className="mb-3 grid grid-cols-[1fr_80px_100px_auto] gap-2">
            <Select value={productToAdd} onValueChange={setProductToAdd}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={1} placeholder="Qty" value={quantityToAdd} onChange={(e) => setQuantityToAdd(e.target.value)} />
            <Input type="number" min={0} placeholder="Unit cost" value={unitCostToAdd} onChange={(e) => setUnitCostToAdd(e.target.value)} />
            <Button type="button" variant="outline" size="icon" onClick={addItem} aria-label="Add item">
              <Plus className="size-4" />
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => (
                <li key={`${item.product}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span>
                    {item.name} ({item.sku}) x{item.quantity} @ ₹{item.unitCost.toFixed(2)} = ₹{(item.quantity * item.unitCost).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => removeItem(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Shipping charge">
            <Input type="number" min={0} value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} />
          </FormField>
          <div className="flex flex-col justify-end gap-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-heading"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>

        <FormField label="Internal notes">
          <Textarea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
