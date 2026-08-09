import { describe, it, expect } from '@jest/globals';
import { resolveTrafficSource } from '../src/modules/cip/geo.util.js';

describe('resolveTrafficSource', () => {
  it('classifies direct traffic when there is no referrer and no UTM', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: '' })).toBe('direct');
  });

  it('classifies a known UTM source directly', () => {
    expect(resolveTrafficSource({ utmSource: 'google', referrer: '' })).toBe('google');
  });

  it('classifies an unrecognized UTM source as a generic campaign', () => {
    expect(resolveTrafficSource({ utmSource: 'newsletter_blast', referrer: '' })).toBe('campaign');
  });

  it('classifies a known referrer host when there is no UTM', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.facebook.com/somepage' })).toBe('facebook');
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.instagram.com/p/xyz' })).toBe('instagram');
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.google.com/search?q=rings' })).toBe('google');
  });

  it('classifies an unrecognized referrer as generic referral traffic', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://some-jewellery-blog.example.com/article' })).toBe('referral');
  });

  it('UTM always wins over a referrer, even a recognizable one', () => {
    expect(resolveTrafficSource({ utmSource: 'email', referrer: 'https://www.facebook.com/somepage' })).toBe('email');
  });
});
