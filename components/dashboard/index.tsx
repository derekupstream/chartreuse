import { User } from '@prisma/client'

type AccountDataType = {
  id: string
  name: string
  accountContactEmail: string
  invites: {
    id: string
    email: string
    accepted: boolean
    account: {
      id: string
      name: string
    } | null
  }[]
  // projects: {
  //   id: string
  // }[]
  users: {
    id: string
    email: string
    name: string | null
    title: string | null
    account: {
      id: string
      name: string
    } | null
  }[]
}

export interface DashboardUser extends User {
  // accountId?: string
  // id: string
  // email: string
  // name: string
  org: {
    id: string
    name: string
    accounts: AccountDataType[]
    isUpstream: boolean
  }
}
