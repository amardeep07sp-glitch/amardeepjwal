// Pure - no DB, independently unit-testable (same convention as
// tax.service.js#splitTax / purchase.statusTransition.js#canTransition).
// Shared by receivables.service.js and payables.service.js so the FIFO
// matching algorithm exists in exactly one place, applied to either an
// Accounts Receivable or Accounts Payable party's line history.
//
// `lines` must be sorted ascending by date, each a signed delta in
// "natural balance direction" terms (positive = a new open item created -
// an invoice for AR, a purchase for AP; negative = that balance being
// settled - a payment for either). generalLedger.service.js's signedDelta
// helper produces exactly this shape for both account types, which is what
// lets one aging engine serve both reports.
export function computeAging(lines, asOfDate = new Date()) {
  const openQueue = [];

  for (const line of lines) {
    if (line.amount > 0.004) {
      openQueue.push({ date: line.date, remaining: line.amount });
    } else if (line.amount < -0.004) {
      let toConsume = -line.amount;
      while (toConsume > 0.004 && openQueue.length > 0) {
        const oldest = openQueue[0];
        const consumed = Math.min(oldest.remaining, toConsume);
        oldest.remaining -= consumed;
        toConsume -= consumed;
        if (oldest.remaining <= 0.004) openQueue.shift();
      }
    }
  }

  const buckets = { current: 0, days31To60: 0, days61To90: 0, days90Plus: 0 };
  const msPerDay = 24 * 60 * 60 * 1000;
  const openItems = [];

  for (const item of openQueue) {
    const ageDays = Math.floor((asOfDate.getTime() - new Date(item.date).getTime()) / msPerDay);
    const remaining = Math.round((item.remaining + Number.EPSILON) * 100) / 100;
    if (ageDays <= 30) buckets.current += remaining;
    else if (ageDays <= 60) buckets.days31To60 += remaining;
    else if (ageDays <= 90) buckets.days61To90 += remaining;
    else buckets.days90Plus += remaining;
    openItems.push({ date: item.date, ageDays, remaining });
  }

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  Object.keys(buckets).forEach((key) => {
    buckets[key] = round2(buckets[key]);
  });
  const total = round2(Object.values(buckets).reduce((sum, v) => sum + v, 0));

  return { buckets, total, openItems };
}
