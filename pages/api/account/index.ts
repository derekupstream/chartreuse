import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import mailgun from "lib/mailgun";
import { Prisma, Account, Invite } from "@prisma/client";

type Response = {
  account?: Account;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method === "POST") {
    try {
      const { name, email, useOrgEmail, orgId, userId } = req.body;

      const account = await prisma.account.create<Prisma.AccountCreateArgs>({
        data: {
          name,
          accountContactEmail: email,
          org: {
            connect: {
              id: orgId,
            },
          },
          ...(useOrgEmail
            ? {}
            : {
                invites: {
                  create: [
                    {
                      email,
                      sentByUserId: userId,
                    },
                  ],
                },
              }),
        },
        include: {
          invites: {
            where: {
              email,
            },
            include: {
              sentBy: {
                include: {
                  org: true,
                },
              },
            },
          },
        },
      });

      if (!useOrgEmail) {
        const invite = ((account as any).invites || []).find(
          (i: Invite) => i.email === email
        );

        await mailgun.messages().send({
          from: "Chartreuse <mattwad@gmail.com@gmail.com>",
          to: email,
          subject: `Invite from ${invite.sentBy.name} to join ReuseIT`,
          template: "invite",
          "v:inviterName": invite.sentBy.name,
          "v:inviterJobTitle": invite.sentBy.title,
          "v:inviterOrg": invite.sentBy.org.name,
          "v:inviteUrl": `${req.headers.origin}/accept?inviteId=${invite.id}`,
        });
      }

      return res.status(200).json({ account });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: "Method not allowed" });
}
