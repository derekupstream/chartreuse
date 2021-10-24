import Accounts from 'components/dashboard/accounts'
import Members from 'components/dashboard/members'
import Projects from 'components/dashboard/projects'
import { Props } from 'components/dashboard'

export const itemMap = {
  accounts: Accounts,
  members: Members,
  projects: Projects,
}

export default function SelectedItem({ item, user }: Props & { item: keyof typeof itemMap }) {
  const SelectedItemComponent = itemMap[item as keyof typeof itemMap]

  return SelectedItemComponent ? <SelectedItemComponent user={user} /> : null
}
