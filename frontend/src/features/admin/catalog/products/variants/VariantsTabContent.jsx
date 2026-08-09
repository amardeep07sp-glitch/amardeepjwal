import { VariantGenerator } from './VariantGenerator';
import { VariantTable } from './VariantTable';

export function VariantsTabContent({ productId }) {
  return (
    <div className="flex flex-col gap-4">
      <VariantGenerator productId={productId} />
      <VariantTable productId={productId} />
    </div>
  );
}
