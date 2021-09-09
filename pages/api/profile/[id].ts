import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { Prisma, User } from "@prisma/client";

type Response = {
  user?: User;
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
      const user = await prisma.user.delete<Prisma.UserDeleteArgs>({
        where: {
          id: req.query.id as string,
        },
      });

      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PATCH") {
    try {
      const user = await prisma.user.update<Prisma.UserUpdateArgs>({
        where: {
          id: req.query.id as string,
        },
        data: {
          name: req.body.name,
          email: req.body.email,
          title: req.body.title,
          phone: req.body.phone,
          account: {
            connect: {
              id: req.body.accountId,
            },
          },
        },
      });

      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: "Method not allowed" });
}
