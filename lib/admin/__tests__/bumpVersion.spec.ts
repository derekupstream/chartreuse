import { bumpVersion } from 'pages/api/admin/factor-databases/index';

describe('bumpVersion', () => {
  it('increments plain integers', () => {
    expect(bumpVersion('1')).toBe('2');
    expect(bumpVersion('9')).toBe('10');
  });

  it('starts a patch series on a calendar release instead of incrementing the month', () => {
    expect(bumpVersion('2026.08')).toBe('2026.08.1');
    expect(bumpVersion('2027.01')).toBe('2027.01.1');
  });

  it('increments an existing patch segment', () => {
    expect(bumpVersion('2026.08.1')).toBe('2026.08.2');
    expect(bumpVersion('1.0.9')).toBe('1.0.10');
  });

  it('appends .1 to anything non-numeric', () => {
    expect(bumpVersion('draft')).toBe('draft.1');
    expect(bumpVersion('v2-beta')).toBe('v2-beta.1');
  });
});
