import SelectedItem from 'components/dashboard/selected-item'
import Template from './template'

export { Template }

export type AccountDataType = {
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
  email: string
  name: string
  org: {
    id: string
    name: string
    accounts: AccountDataType[]
  }
}

export type Props = {
  user: DashboardUser
  products?: any
  selectedMenuItem?: string
}

const INITIAL_SELECTED_MENU_ITEM = 'projects'

export default function Dashboard({ user }: Props) {
  return (
    <Template user={user} selectedMenuItem={INITIAL_SELECTED_MENU_ITEM}>
      <SelectedItem item={INITIAL_SELECTED_MENU_ITEM} user={user} />
    </Template>
  )
}
