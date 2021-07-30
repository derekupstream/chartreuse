import Accounts from "components/dashboard/accounts";
import { Props } from "components/dashboard";

export const itemMap = {
  accounts: Accounts,
  // eslint-disable-next-line react/display-name
  members: () => <div>Members</div>,
  // eslint-disable-next-line react/display-name
  projects: () => <div>Projects</div>,
};

export default function SelectedItem({
  item,
  user,
}: Props & { item: keyof typeof itemMap }) {
  const SelectedItemComponent = itemMap[item as keyof typeof itemMap];

  return SelectedItemComponent ? <SelectedItemComponent user={user} /> : null;
}
