import ExcelJS from 'exceljs'
import prisma from 'lib/prisma'

export async function getUserExport() {
  const users = await prisma.user.findMany({
    include: {
      org: true,
      account: true,
    },
  })

  return getExportFile(users)
}

function getUsers() {
  return prisma.user.findMany({
    include: {
      org: true,
      account: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

type User = Awaited<ReturnType<typeof getUsers>>[number]

function getExportFile(users: User[]) {
  const workbook = new ExcelJS.Workbook()

  addUsersSheet(workbook, users)

  return workbook
}

function addUsersSheet(workbook: ExcelJS.Workbook, users: User[]) {
  const sheet = workbook.addWorksheet('Users')

  sheet.columns = [
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Phone', key: 'phone', width: 30 },
    { header: 'Join date', key: 'joinDate', width: 20 },
    { header: 'Account', key: 'account', width: 30 },
    { header: 'Organization', key: 'org', width: 30 },
  ]

  sheet.addRows(
    users.map(user => ({
      email: user.email,
      name: user.name,
      phone: user.phone,
      joinDate: user.createdAt,
      account: user.account?.name || '',
      org: user.org.name,
    }))
  )
}
