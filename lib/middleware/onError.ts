import type { NextApiRequest, NextApiResponse } from 'next';

export function onError(err: any, req: NextApiRequest, res: NextApiResponse, next: () => void) {
  console.error('Server error', err.stack || err);
  const errorMessage = err.message || 'Something went wrong!';
  res.status(500).json({ message: errorMessage });
}

export default onError;
