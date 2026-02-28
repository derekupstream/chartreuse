import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';

export const config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
};

const BUCKET = 'methodology-images';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { fileName, fileData, mimeType } = req.body as {
    fileName?: string;
    fileData?: string;
    mimeType?: string;
  };

  if (!fileName || !fileData || !mimeType) {
    return res.status(400).json({ error: 'fileName, fileData, and mimeType are required' });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const buffer = Buffer.from(fileData, 'base64');
  const ext = fileName.split('.').pop() ?? 'png';
  const path = `uploads/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    console.error('Supabase storage upload error:', error);
    return res.status(500).json({ error: error.message });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return res.json({ url: data.publicUrl });
});
