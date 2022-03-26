import Template from './template'

export { Template }

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
    }
  }[]
  projects: {
    id: string
  }[]
  users: {
    id: string
    email: string
    name: string
    title: string
    account: {
      id: string
      name: string
    }
  }[]
}

export type DashboardUser = {
  accountId?: string
  id: string
  email: string
  name: string
  org: {
    id: string
    name: string
    accounts: AccountDataType[]
  }
}
