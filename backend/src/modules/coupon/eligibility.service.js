import { orderRepository } from '../order/order.repository.js';
import { loyaltyService } from '../customer/loyalty.service.js';
import { COUPON_ELIGIBILITY_TYPES } from './coupon.constants.js';

// "VIP" is deliberately reused from the already-real Loyalty tier system
// (customer.constants.js#LOYALTY_TIERS) rather than a second, invented
// definition - gold tier and above (silver is the default starting tier
// every customer has from day one).
const VIP_TIERS = ['gold', 'platinum', 'diamond'];

// Every check here reads real backend data (Order history, Loyalty tier) -
// never a client-supplied flag. Returns { eligible, reason } so callers
// can surface a real, specific error message instead of a generic
// "not eligible".
export async function checkCustomerEligibility(eligibility, customerId) {
  const type = eligibility?.type ?? COUPON_ELIGIBILITY_TYPES.ALL_CUSTOMERS;

  switch (type) {
    case COUPON_ELIGIBILITY_TYPES.ALL_CUSTOMERS:
      return { eligible: true };

    case COUPON_ELIGIBILITY_TYPES.NEW_CUSTOMERS:
    case COUPON_ELIGIBILITY_TYPES.FIRST_ORDER: {
      const realOrderCount = await orderRepository.countRealOrdersByCustomer(customerId);
      return realOrderCount === 0
        ? { eligible: true }
        : { eligible: false, reason: 'This offer is only for new customers placing their first order.' };
    }

    case COUPON_ELIGIBILITY_TYPES.EXISTING_CUSTOMERS: {
      const realOrderCount = await orderRepository.countRealOrdersByCustomer(customerId);
      return realOrderCount > 0
        ? { eligible: true }
        : { eligible: false, reason: 'This offer is only for customers with a previous order.' };
    }

    case COUPON_ELIGIBILITY_TYPES.VIP_CUSTOMERS: {
      const loyalty = await loyaltyService.getLoyalty(customerId).catch(() => null);
      return loyalty && VIP_TIERS.includes(loyalty.currentTier)
        ? { eligible: true }
        : { eligible: false, reason: 'This offer is only for VIP members.' };
    }

    case COUPON_ELIGIBILITY_TYPES.SELECTED_CUSTOMERS: {
      const selected = eligibility?.selectedCustomers ?? [];
      return selected.some((id) => String(id) === String(customerId))
        ? { eligible: true }
        : { eligible: false, reason: 'This offer is not available on your account.' };
    }

    default:
      return { eligible: false, reason: 'This offer is not currently available.' };
  }
}
