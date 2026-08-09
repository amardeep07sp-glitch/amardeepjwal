import { describe, it, expect } from '@jest/globals';
import { parseUserAgent } from '../src/modules/cip/uaParser.util.js';

const CHROME_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const IPAD_SAFARI = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

describe('parseUserAgent', () => {
  it('identifies a desktop Chrome/Windows user agent', () => {
    expect(parseUserAgent(CHROME_DESKTOP)).toEqual({ type: 'desktop', browser: 'Chrome', os: 'Windows' });
  });

  it('identifies a mobile Safari/iOS user agent', () => {
    const result = parseUserAgent(SAFARI_IPHONE);
    expect(result.type).toBe('mobile');
    expect(result.os).toBe('iOS');
  });

  it('identifies a desktop Firefox/Linux user agent', () => {
    expect(parseUserAgent(FIREFOX_LINUX)).toEqual({ type: 'desktop', browser: 'Firefox', os: 'Linux' });
  });

  it('identifies a mobile Chrome/Android user agent', () => {
    const result = parseUserAgent(CHROME_ANDROID);
    expect(result.type).toBe('mobile');
    expect(result.os).toBe('Android');
  });

  it('identifies a tablet from an iPad user agent', () => {
    expect(parseUserAgent(IPAD_SAFARI).type).toBe('tablet');
  });

  it('falls back to unknown for a missing or empty user agent', () => {
    expect(parseUserAgent('')).toEqual({ type: 'unknown', browser: 'Unknown', os: 'Unknown' });
    expect(parseUserAgent(undefined)).toEqual({ type: 'unknown', browser: 'Unknown', os: 'Unknown' });
  });
});
