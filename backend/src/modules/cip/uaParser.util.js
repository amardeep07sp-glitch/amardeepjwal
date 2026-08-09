import { DEVICE_TYPES } from './cip.constants.js';

// Pure - no dependency added just for this (no ua-parser-js in package.json
// and none of its extra coverage is needed here) - a lightweight regex scan
// covering the browser/OS/device families that actually matter for
// Device Analytics. Independently unit-testable like every other pure
// resolver in this codebase (inventory.stockStatus.js, purchase
// .statusTransition.js, tax.service.js#splitTax).
const BROWSER_PATTERNS = [
  ['Edge', /Edg\//i],
  ['Samsung Internet', /SamsungBrowser/i],
  ['Opera', /OPR\//i],
  ['Chrome', /Chrome\//i],
  ['Firefox', /Firefox\//i],
  ['Safari', /Version\/.*Safari/i],
  ['Internet Explorer', /Trident|MSIE/i],
];

const OS_PATTERNS = [
  ['Windows', /Windows NT/i],
  // iOS devices spoof "like Mac OS X" in their own UA string, so iOS must
  // be checked before the (looser) macOS pattern or every iPhone/iPad
  // would misreport as macOS.
  ['iOS', /iPhone|iPad|iPod/i],
  ['macOS', /Mac OS X/i],
  ['Android', /Android/i],
  ['Linux', /Linux/i],
];

export function parseUserAgent(userAgent) {
  const ua = userAgent || '';

  const browser = BROWSER_PATTERNS.find(([, pattern]) => pattern.test(ua))?.[0] ?? 'Unknown';
  const os = OS_PATTERNS.find(([, pattern]) => pattern.test(ua))?.[0] ?? 'Unknown';

  let type = DEVICE_TYPES.DESKTOP;
  if (/iPad|Tablet|Nexus 7|Nexus 10/i.test(ua)) {
    type = DEVICE_TYPES.TABLET;
  } else if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) {
    type = DEVICE_TYPES.MOBILE;
  } else if (!ua) {
    type = DEVICE_TYPES.UNKNOWN;
  }

  return { type, browser, os };
}
