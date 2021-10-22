import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { Prisma, SingleUseLineItem } from "@prisma/client";

type Response = {
  lineItem?: SingleUseLineItem;
  lineItems?: SingleUseLineItem[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const projectId = req.query.id as string;

  if (req.method === "GET") {
    const lineItems =
      await prisma.singleUseLineItem.findMany<Prisma.SingleUseLineItemFindManyArgs>(
        {
          where: {
            projectId,
          },
        }
      );

    return res.status(200).json({ lineItems });
  } else if (req.method === "POST") {
    try {
      const lineItem =
        await prisma.singleUseLineItem.create<Prisma.SingleUseLineItemCreateArgs>(
          {
            data: req.body,
          }
        );

      return res.status(200).json({ lineItem });
    } catch (error: any) {
      console.error("Error saving single use item", error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.singleUseLineItem.delete<Prisma.SingleUseLineItemDeleteArgs>(
        {
          where: {
            id: projectId,
          },
        }
      );
      return res.status(200);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: "Method not allowed" });
}
