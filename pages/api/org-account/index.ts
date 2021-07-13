import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { User, Prisma } from "@prisma/client";

type Response = {
  user?: User;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method === "POST") {
    try {
      const { id, name, email, title, orgName, numberOfClientAccounts } =
        req.body;

      const user = await prisma.user.create<Prisma.UserCreateArgs>({
        data: {
          id,
          name,
          email,
          title,
          org: {
            create: {
              name: orgName,
              metadata: { numberOfClientAccounts },
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
