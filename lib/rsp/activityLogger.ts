import prisma from 'lib/prisma';

export type ActivityOutcome =
  | 'success'
  | 'auth_failed'
  | 'validation_failed'
  | 'server_error'
  | 'dedup_conflict'
  | 'method_not_allowed'
  /** A validate-only request: priced and checked, but nothing stored */
  | 'dry_run';

type LogParams = {
  apiKeyId?: string | null;
  orgId?: string | null;
  endpoint: string;
  httpStatus: number;
  outcome: ActivityOutcome;
  errorMessage?: string | null;
  errorCode?: string | null;
  latencyMs?: number;
  requestSummary?: unknown;
  responseSummary?: unknown;
  clientIp?: string | null;
};

/** Truncate large values so the activity log doesn't store full bulk payloads. */
function summarize(value: unknown, maxStringLen = 1000): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return value.length > maxStringLen ? value.slice(0, maxStringLen) + '…' : value;
  if (Array.isArray(value)) {
    if (value.length > 20) return [...value.slice(0, 20), `…(${value.length - 20} more)`];
    return value.map(v => summarize(v, maxStringLen));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = summarize(v, maxStringLen);
    return out;
  }
  return value;
}

export async function logRspActivity(params: LogParams): Promise<void> {
  try {
    await prisma.rspApiActivityLog.create({
      data: {
        apiKeyId: params.apiKeyId ?? null,
        orgId: params.orgId ?? null,
        endpoint: params.endpoint,
        httpStatus: params.httpStatus,
        outcome: params.outcome,
        errorMessage: params.errorMessage ?? null,
        errorCode: params.errorCode ?? null,
        latencyMs: params.latencyMs ?? null,
        requestSummary: params.requestSummary ? (summarize(params.requestSummary) as any) : undefined,
        responseSummary: params.responseSummary ? (summarize(params.responseSummary) as any) : undefined,
        clientIp: params.clientIp ?? null
      }
    });
  } catch (err) {
    // Never let logging break the request path
    console.error('[rsp activity log] failed to write:', err);
  }
}
