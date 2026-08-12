/**
 * Things wrong with an RSP usage payload that don't justify rejecting it, but that the
 * partner must be told about.
 *
 * The intake endpoint accepts a payload whose `reusable_type` values match no impact factors
 * and stores the period anyway; a first-time `client_id` creates a new account rather than
 * being rejected. Without these warnings an integration can look finished while rows are
 * priced off default factors or a typo'd client_id quietly spawns a second account, and only
 * Upstream staff would ever see the problem (as a DataHealthIssue nobody outside the admin
 * area reads).
 *
 * Returned in the API response so a partner sees them during integration, and echoed into
 * the activity log so support can see what a partner was told.
 */
import { RSP_IMPACT_FACTORS, type ImpactFactors } from 'lib/rsp/impactFactors';

export type PayloadWarning = {
  code:
    | 'unlinked_client_id'
    | 'unknown_reusable_type'
    | 'no_outbound_events'
    | 'duplicate_reusable_type'
    | 'client_account_created';
  message: string;
  details?: Record<string, unknown>;
};

export type WarningInput = {
  clientId: string;
  events: { reusable_type: string; in_warehouse_events: number; out_warehouse_events: number }[];
  /** Null when no account carries this client_id for the submitting org */
  accountId: string | null;
};

/** The `reusable_type` vocabulary the calculator recognises, excluding the fallback. */
export function knownReusableTypes(): string[] {
  return Object.keys(RSP_IMPACT_FACTORS)
    .filter(key => key !== 'default')
    .sort();
}

export function isKnownReusableType(reusableType: string): boolean {
  const key = reusableType.trim().toLowerCase();
  return key !== 'default' && key in RSP_IMPACT_FACTORS;
}

export function defaultFactors(): ImpactFactors {
  return RSP_IMPACT_FACTORS.default;
}

export function collectPayloadWarnings({ clientId, events, accountId }: WarningInput): PayloadWarning[] {
  const warnings: PayloadWarning[] = [];

  if (!accountId) {
    warnings.push({
      code: 'unlinked_client_id',
      message:
        `client_id "${clientId}" is not linked to a Chart-Reuse account yet. A real submission will create ` +
        `a new account for it automatically (pass client_name to control its display name). If this customer ` +
        `already has a Chart-Reuse account, ask Upstream to link it first so the data lands there instead.`,
      details: { clientId }
    });
  }

  const unknownTypes = Array.from(
    new Set(events.filter(event => !isKnownReusableType(event.reusable_type)).map(event => event.reusable_type))
  );
  if (unknownTypes.length > 0) {
    warnings.push({
      code: 'unknown_reusable_type',
      message:
        `${unknownTypes.length} reusable_type value(s) were not recognised and fell back to default impact ` +
        `factors, which makes their results approximate. Use one of the supported types.`,
      details: { unknownTypes, supportedTypes: knownReusableTypes() }
    });
  }

  // One row is written per event, so a repeated type produces separate rows rather than a sum.
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  events.forEach(event => {
    const key = event.reusable_type.trim().toLowerCase();
    if (seen.has(key)) duplicated.add(event.reusable_type);
    seen.add(key);
  });
  if (duplicated.size > 0) {
    warnings.push({
      code: 'duplicate_reusable_type',
      message:
        `The same reusable_type appears more than once in events[]. Each entry is stored as its own row ` +
        `rather than being combined — send one entry per type per period.`,
      details: { duplicatedTypes: Array.from(duplicated) }
    });
  }

  const totalOutbound = events.reduce((sum, event) => sum + (event.out_warehouse_events || 0), 0);
  if (totalOutbound === 0) {
    warnings.push({
      code: 'no_outbound_events',
      message:
        `out_warehouse_events totals zero across every entry, so all impact metrics for this period are zero. ` +
        `Impact is calculated from items sent out, not items returned.`,
      details: { inboundTotal: events.reduce((sum, event) => sum + (event.in_warehouse_events || 0), 0) }
    });
  }

  return warnings;
}
