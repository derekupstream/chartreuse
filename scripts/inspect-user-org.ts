import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const TARGET_EMAIL = process.argv[2];
if (!TARGET_EMAIL) {
  console.error('Usage: npx tsx scripts/inspect-user-org.ts <email>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: TARGET_EMAIL, mode: 'insensitive' } },
    include: {
      account: {
        include: {
          users: { select: { id: true, email: true } },
          org: {
            include: {
              accounts: {
                include: {
                  users: { select: { id: true, email: true } },
                  projects: { select: { id: true, name: true, category: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log(`No DB user found for ${TARGET_EMAIL}`);
  } else {
    console.log('DB User:');
    console.log(`  id:         ${user.id}`);
    console.log(`  email:      ${user.email}`);
    console.log(`  orgId:      ${(user as any).orgId}`);
    console.log(`  accountId:  ${user.accountId ?? '(none)'}`);
    console.log(`  account:    ${user.account?.id ?? '(none)'} (${user.account?.name ?? ''})`);
    const org = user.account?.org ?? (user as any).orgId
      ? await prisma.org.findUnique({
          where: { id: (user as any).orgId },
          include: {
            accounts: {
              include: {
                users: { select: { id: true, email: true } },
                projects: { select: { id: true, name: true, category: true } },
              },
            },
            users: { select: { id: true, email: true } },
          },
        })
      : null;
    if (org) {
      console.log(`  org:        ${org.id} (${org.name})`);
      console.log(`  org users:  ${(org as any).users?.map((u: any) => u.email).join(', ') || '(none)'}`);
      console.log(`  org accounts: ${org.accounts.length}`);
      for (const a of org.accounts) {
        console.log(`    - account ${a.id} (${a.name})`);
        console.log(`       users:    ${a.users.map((u: any) => u.email).join(', ') || '(none)'}`);
        console.log(`       projects: ${a.projects.length}`);
        for (const p of a.projects) {
          console.log(`         · ${p.id} ${p.name} [${p.category}]`);
        }
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let authUser: any = null;
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      authUser = data.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
      if (authUser) break;
      if (data.users.length < 200) break;
      page += 1;
    }
    if (authUser) {
      console.log('\nSupabase auth user:');
      console.log(`  id:            ${authUser.id}`);
      console.log(`  email:         ${authUser.email}`);
      console.log(`  created_at:    ${authUser.created_at}`);
      console.log(`  confirmed_at:  ${authUser.email_confirmed_at ?? '(not confirmed)'}`);
    } else {
      console.log(`\nNo Supabase auth user with email ${TARGET_EMAIL}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
