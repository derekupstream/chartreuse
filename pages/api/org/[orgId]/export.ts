import type { NextApiResponse } from 'next'
import { handlerWithUser, NextApiRequestWithUser, requireUpstream } from 'lib/middleware'
import { getOrgExport } from 'lib/exports'

const handler = handlerWithUser()

handler.use(requireUpstream).get(getOrgExportMiddleware)

async function getOrgExportMiddleware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string

  const file = await getOrgExport(orgId)
  const buffer = await file.xlsx.writeBuffer()

  // write the file to the response (should prompt user to download or open the file)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Length', Buffer.byteLength(buffer))
  res.setHeader('Content-Disposition', `attachment; filename=OrgExport-${orgId}.xlsx`)
  res.write(buffer, 'binary')
  res.end()

  res.status(200).end()
}

export default handler
