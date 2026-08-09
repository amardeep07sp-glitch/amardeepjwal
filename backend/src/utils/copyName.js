// "Gold Ring" -> "Gold Ring (Copy)" -> "Gold Ring (Copy 2)" -> ... -
// re-duplicating a copy increments the suffix instead of stacking
// "(Copy) (Copy) (Copy)" onto the name every time. Shared by every module
// with a "Duplicate" action (Product, Collection, ...) - extracted out of
// product.service.js once a second module needed the identical logic.
export function buildCopyName(name) {
  const match = name.match(/^(.*) \(Copy(?: (\d+))?\)$/);
  if (!match) return `${name} (Copy)`;
  const [, base, num] = match;
  return `${base} (Copy ${(num ? Number(num) : 1) + 1})`;
}
