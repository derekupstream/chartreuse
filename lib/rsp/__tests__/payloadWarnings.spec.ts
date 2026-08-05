import { collectPayloadWarnings, isKnownReusableType, knownReusableTypes } from '../payloadWarnings';

const event = (reusable_type: string, out_warehouse_events = 100, in_warehouse_events = 90) => ({
  reusable_type,
  out_warehouse_events,
  in_warehouse_events
});

const codes = (warnings: { code: string }[]) => warnings.map(w => w.code).sort();

describe('collectPayloadWarnings', () => {
  it('reports nothing for a clean payload', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'campus-01',
      accountId: 'acct-1',
      events: [event('cup'), event('bowl')]
    });
    expect(warnings).toEqual([]);
  });

  it('warns when the client_id resolved to no account', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'never-mapped',
      accountId: null,
      events: [event('cup')]
    });
    expect(codes(warnings)).toEqual(['unlinked_client_id']);
    // The partner has to know which id failed to resolve.
    expect(warnings[0].message).toContain('never-mapped');
  });

  it('warns on an unrecognised type and lists the supported ones', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'campus-01',
      accountId: 'acct-1',
      events: [event('cups'), event('cup')]
    });
    expect(codes(warnings)).toEqual(['unknown_reusable_type']);
    expect(warnings[0].details?.unknownTypes).toEqual(['cups']);
    expect(warnings[0].details?.supportedTypes).toEqual(knownReusableTypes());
  });

  it('treats type matching as case-insensitive', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'campus-01',
      accountId: 'acct-1',
      events: [event('CUP')]
    });
    expect(codes(warnings)).toEqual([]);
  });

  it('warns when a type is repeated, since the rows are not combined', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'campus-01',
      accountId: 'acct-1',
      events: [event('cup'), event('Cup')]
    });
    expect(codes(warnings)).toEqual(['duplicate_reusable_type']);
  });

  it('warns when nothing went out, which usually means the fields were swapped', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'campus-01',
      accountId: 'acct-1',
      events: [event('cup', 0, 12400)]
    });
    expect(codes(warnings)).toEqual(['no_outbound_events']);
    expect(warnings[0].details?.inboundTotal).toBe(12400);
  });

  it('reports every applicable problem at once', () => {
    const warnings = collectPayloadWarnings({
      clientId: 'never-mapped',
      accountId: null,
      events: [event('cups', 0, 10), event('cups', 0, 5)]
    });
    expect(codes(warnings)).toEqual([
      'duplicate_reusable_type',
      'no_outbound_events',
      'unknown_reusable_type',
      'unlinked_client_id'
    ]);
  });
});

describe('isKnownReusableType', () => {
  it('accepts the documented vocabulary', () => {
    expect(knownReusableTypes()).toEqual([
      'bowl',
      'container',
      'cup',
      'fork',
      'glass',
      'knife',
      'plate',
      'spoon',
      'tray',
      'utensils'
    ]);
    knownReusableTypes().forEach(type => expect(isKnownReusableType(type)).toBe(true));
  });

  it('does not let "default" through as a type a partner may send', () => {
    expect(isKnownReusableType('default')).toBe(false);
    expect(knownReusableTypes()).not.toContain('default');
  });
});
