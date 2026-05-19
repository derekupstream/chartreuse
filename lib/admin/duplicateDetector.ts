import type { PrismaClient } from '@prisma/client';

export type Bucket = 'AUTO_MERGE' | 'EMPTY_DELETE' | 'NEEDS_REVIEW';

export type DuplicateOrg = {
  id: string;
  name: string;
  createdAt: Date;
  isUpstream: boolean;
  userCount: number;
  accountCount: number;
  projectCount: number;
  inviteCount: number;
  users: Array<{ id: string; email: string; name: string | null; createdAt: Date }>;
  emailDomains: string[];
};

export type DuplicateEntry = {
  org: DuplicateOrg;
  bucket: Bucket;
  reason: string;
};

export type DuplicateGroup = {
  key: string;
  displayName: string;
  canonical: DuplicateOrg;
  duplicates: DuplicateEntry[];
};

export type DuplicateReport = {
  groups: DuplicateGroup[];
  counts: { autoMerge: number; emptyDelete: number; needsReview: number; totalDuplicates: number };
};

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'me.com',
  'live.com',
  'protonmail.com',
  'proton.me',
  'msn.com',
  'comcast.net',
  'verizon.net'
]);

export function isPersonalEmailDomain(domain: string) {
  return PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
}

export async function detectDuplicates(prisma: PrismaClient): Promise<DuplicateReport> {
  const orgs = await prisma.org.findMany({
    include: {
      users: { select: { id: true, email: true, name: true, createdAt: true } },
      _count: { select: { accounts: true, projects: true, invites: true } }
    }
  });

  const groups = new Map<string, DuplicateOrg[]>();
  for (const o of orgs) {
    const trimmed = (o.name ?? '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    const dup: DuplicateOrg = {
      id: o.id,
      name: o.name,
      createdAt: o.createdAt,
      isUpstream: o.isUpstream,
      userCount: o.users.length,
      accountCount: o._count.accounts,
      projectCount: o._count.projects,
      inviteCount: o._count.invites,
      users: o.users.map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt })),
      emailDomains: Array.from(
        new Set(o.users.map(u => u.email.split('@')[1]?.toLowerCase()).filter(Boolean) as string[])
      )
    };
    const list = groups.get(key) ?? [];
    list.push(dup);
    groups.set(key, list);
  }

  const result: DuplicateGroup[] = [];

  for (const [key, dupOrgs] of Array.from(groups.entries())) {
    if (dupOrgs.length < 2) continue;

    const ranked = [...dupOrgs].sort((a, b) => {
      if (b.userCount !== a.userCount) return b.userCount - a.userCount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const canonical = ranked[0];
    const others = ranked.slice(1);

    const canonicalWorkDomains = new Set<string>(canonical.emailDomains.filter(d => !isPersonalEmailDomain(d)));

    const duplicates: DuplicateEntry[] = others.map((org): DuplicateEntry => {
      if (org.userCount === 0 && org.accountCount === 0 && org.projectCount === 0 && org.inviteCount === 0) {
        return { org, bucket: 'EMPTY_DELETE', reason: 'Empty org (0 users, 0 accounts, 0 projects, 0 invites)' };
      }

      const orgWorkDomains = org.emailDomains.filter((d: string) => !isPersonalEmailDomain(d));

      if (
        orgWorkDomains.length > 0 &&
        canonicalWorkDomains.size > 0 &&
        orgWorkDomains.every((d: string) => canonicalWorkDomains.has(d))
      ) {
        return {
          org,
          bucket: 'AUTO_MERGE',
          reason: `Users share work-email domain with canonical (${orgWorkDomains.join(', ')})`
        };
      }

      if (orgWorkDomains.length === 0) {
        return {
          org,
          bucket: 'NEEDS_REVIEW',
          reason: `Only personal-email users (${org.emailDomains.join(', ') || 'none'}) — could be a different person`
        };
      }

      return {
        org,
        bucket: 'NEEDS_REVIEW',
        reason: `Different work-email domain than canonical (${orgWorkDomains.join(', ')} vs ${
          Array.from(canonicalWorkDomains).join(', ') || '(canonical has none)'
        })`
      };
    });

    result.push({ key, displayName: canonical.name, canonical, duplicates });
  }

  result.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const counts = result.reduce(
    (acc, g) => {
      for (const d of g.duplicates) {
        acc.totalDuplicates++;
        if (d.bucket === 'AUTO_MERGE') acc.autoMerge++;
        else if (d.bucket === 'EMPTY_DELETE') acc.emptyDelete++;
        else acc.needsReview++;
      }
      return acc;
    },
    { autoMerge: 0, emptyDelete: 0, needsReview: 0, totalDuplicates: 0 }
  );

  return { groups: result, counts };
}
