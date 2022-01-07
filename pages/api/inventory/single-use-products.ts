import { getProducts } from 'lib/calculator/datasets/single-use-products'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const products = await getProducts()
  res.json(products)
}
