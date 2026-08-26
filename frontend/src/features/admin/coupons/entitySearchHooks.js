import { useProducts } from '../catalog/products/productsApi';
import { useCustomers } from '../customers/customersApi';

// Normalizes each admin list hook to the flat { data, isFetching } shape
// EntitySearchPicker expects - only searches once the admin has actually
// typed something (an unfiltered `useProducts({limit:20})` on every popover
// open would just be a random, unhelpful slice of the catalog).
export const useProductSearch = (search) => {
  const { data, isFetching } = useProducts({ search, limit: 20 }, { enabled: search.trim().length > 0 });
  return { data: data?.items ?? [], isFetching };
};

export const useCustomerSearch = (search) => {
  const { data, isFetching } = useCustomers({ search, limit: 20 }, { enabled: search.trim().length > 0 });
  return { data: data?.items ?? [], isFetching };
};
