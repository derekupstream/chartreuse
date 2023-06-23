import type { NextApiRequest, NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
export function onError(err: any, req: NextApiRequestWithUser | NextApiRequest, res: NextApiResponse) {
  console.error('Server error', {
    error: err.stack || err,
    url: req.url,
    userId: (req as NextApiRequestWithUser).user?.id,
    body: req.body
  });

  const errorMessage = err.message || 'Something went wrong!';
  res.status(500).json({ message: errorMessage });
}

export default onError;
