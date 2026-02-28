import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envLocal = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');

function getEnv(key: string): string {
  const match = envLocal.match(new RegExp(`${key}="?([^"\\n]+)`));
  if (!match) throw new Error(`Missing ${key} in .env.local`);
  return match[1];
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(url, key);

const { data, error } = await supabase.storage.createBucket('methodology-images', { public: true });

if (error && error.message !== 'Bucket already exists') {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log(error?.message === 'Bucket already exists'
  ? 'Bucket already exists — nothing to do.'
  : 'Created bucket: methodology-images (public)');
