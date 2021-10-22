import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { Prisma, Invite, User, Org } from "@prisma/client";
import mailgun from "lib/mailgun";

type UserWithOrg = User & { org: Org };
type InviteWithSentBy = Invite & { sentBy: UserWithOrg };

type Response = {
  invite?: InviteWithSentBy;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method === "POST") {
    try {
      const { email, accountId, userId } = req.body;

      const invite = (await prisma.invite.create<Prisma.InviteCreateArgs>({
        data: {
          email,
          accountId,
          sentByUserId: userId,
        },
        include: {
          sentBy: {
            include: {
              org: true,
            },
          },
        },
      })) as InviteWithSentBy;

      await mailgun.messages().send({
        from: "Chartreuse <mattwad@gmail.com>",
        to: email,
        subject: `Invite from ${invite.sentBy.name} to join ReuseIT`,
        template: "invite",
        "v:inviterName": invite.sentBy.name,
        "v:inviterJobTitle": invite.sentBy.title,
        "v:inviterOrg": invite.sentBy.org.name,
        "v:inviteUrl": `${req.headers.origin}/accept?inviteId=${invite.id}`,
      });

      return res.status(200).json({ invite });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: "Method not allowed" });
}
