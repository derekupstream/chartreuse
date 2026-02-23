import { createServerClient } from '@supabase/ssr';
import { serialize } from 'cookie';
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';

export function createSupabaseApiClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value ?? '' }));
      },
      setAll(cookiesToSet) {
        const serialized = cookiesToSet.map(({ name, value, options }) => serialize(name, value, options as any));
        res.setHeader('Set-Cookie', serialized);
      }
    }
  });
}

export function createSupabaseServerPropsClient(context: GetServerSidePropsContext) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return Object.entries(context.req.cookies).map(([name, value]) => ({ name, value: value ?? '' }));
      },
      setAll(cookiesToSet) {
        const serialized = cookiesToSet.map(({ name, value, options }) => serialize(name, value, options as any));
        context.res.setHeader('Set-Cookie', serialized);
      }
    }
  });
}
