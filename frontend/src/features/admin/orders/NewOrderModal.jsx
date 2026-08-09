import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ScanBarcode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '../catalog/products/productsApi';
import { useAllWarehouses } from '../inventory/warehousesApi';
import { CustomerPickerSelect } from './CustomerPickerSelect';
import { AddressPickerSelect } from './AddressPickerSelect';
import { useCreateOrder, useLookupByBarcode } from './ordersApi';

export function NewOrderModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [handlingCharge, setHandlingCharge] = useState('0');
  const [couponDiscount, setCouponDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [productToAdd, setProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('1');
  const [barcodeValue, setBarcodeValue] = useState('');

  const { data: productsData } = useProducts({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: warehousesData } = useAllWarehouses();
  const createOrder = useCreateOrder();
  const lookupByBarcode = useLookupByBarcode();

  const products = productsData?.items ?? [];
  const warehouses = warehousesData ?? [];

  const reset = () => {
    setCustomer('');
    setBillingAddress('');
    setShippingAddress('');
    setWarehouse('');
    setShippingCharge('0');
    setHandlingCharge('0');
    setCouponDiscount('0');
    setNotes('');
    setItems([]);
    setProductToAdd('');
    setQuantityToAdd('1');
    setBarcodeValue('');
  };

  const addManualItem = () => {
    const product = products.find((p) => p.id === productToAdd);
    if (!product) {
      toast.error('Select a product first');
      return;
    }
    setItems((prev) => [...prev, { product: product.id, variant: null, sku: product.sku, name: product.name, quantity: Number(quantityToAdd) || 1 }]);
    setProductToAdd('');
    setQuantityToAdd('1');
  };

  const addByBarcode = async () => {
    if (!barcodeValue.trim()) return;
    try {
      const { data: resolved } = await lookupByBarcode.mutateAsync(barcodeValue.trim());
      setItems((prev) => [...prev, { product: resolved.product, variant: resolved.variant, sku: resolved.sku, name: resolved.name, quantity: 1 }]);
      setBarcodeValue('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!customer) {
      toast.error('Select a customer');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one line item');
      return;
    }
    try {
      const { data: order } = await createOrder.mutateAsync({
        customer,
        billingAddress: billingAddress || undefined,
        shippingAddress: shippingAddress || undefined,
        warehouse: warehouse || undefined,
        shippingCharge: Number(shippingCharge) || 0,
        handlingCharge: Number(handlingCharge) || 0,
        couponDiscount: Number(couponDiscount) || 0,
        notes,
        items: items.map((i) => ({ product: i.product, variant: i.variant, quantity: i.quantity })),
      });
      toast.success(`Order ${order.orderNumber} created`);
      reset();
      onOpenChange(false);
      navigate(`/admin/orders/${order.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New order"
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Creating...' : 'Create order'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
        <FormField label="Customer" required>
          <CustomerPickerSelect value={customer} onChange={setCustomer} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Billing address">
            <AddressPickerSelect customerId={customer} value={billingAddress} onChange={setBillingAddress} label="Billing address" />
          </FormField>
          <FormField label="Shipping address">
            <AddressPickerSelect customerId={customer} value={shippingAddress} onChange={setShippingAddress} label="Shipping address" />
          </FormField>
        </div>

        <FormField label="Warehouse" description="Defaults to the Default Warehouse if left unset">
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Default Warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium text-heading">Line items</p>

          <div className="mb-3 flex gap-2">
            <Input
              placeholder="Scan or type barcode value"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addByBarcode())}
            />
            <Button type="button" variant="outline" onClick={addByBarcode} disabled={lookupByBarcode.isPending}>
              <ScanBarcode className="size-4" />
            </Button>
          </div>

          <div className="mb-3 flex gap-2">
            <Select value={productToAdd} onValueChange={setProductToAdd}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Or select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={1} className="w-20" value={quantityToAdd} onChange={(e) => setQuantityToAdd(e.target.value)} />
            <Button type="button" variant="outline" size="icon" onClick={addManualItem} aria-label="Add item">
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
                    {item.name} ({item.sku}) x{item.quantity}
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => removeItem(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Shipping charge">
            <Input type="number" min={0} value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} />
          </FormField>
          <FormField label="Handling charge">
            <Input type="number" min={0} value={handlingCharge} onChange={(e) => setHandlingCharge(e.target.value)} />
          </FormField>
          <FormField label="Coupon discount">
            <Input type="number" min={0} value={couponDiscount} onChange={(e) => setCouponDiscount(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
