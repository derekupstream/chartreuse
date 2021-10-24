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
  id: string
  email: string | null
  name: string | null
  org: {
    id: string
    name: string
    accounts: AccountDataType[]
  }
}
