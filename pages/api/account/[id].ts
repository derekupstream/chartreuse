import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { Prisma, Account } from "@prisma/client";

type Response = {
  account?: Account;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method === "DELETE") {
    try {
      const account = await prisma.account.delete<Prisma.AccountDeleteArgs>({
        where: {
          id: req.query.id as string,
        },
      });

      return res.status(200).json({ account });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PATCH") {
    try {
      const account = await prisma.account.update<Prisma.AccountUpdateArgs>({
        where: {
          id: req.query.id as string,
        },
        data: {
          name: req.body.name,
        },
      });

      return res.status(200).json({ account });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: "Method not allowed" });
}
