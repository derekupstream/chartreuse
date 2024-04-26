import { AssumptionsPage } from 'components/share/AssumptionsPage';
import { SharedPageLayout } from 'layouts/SharedPageLayout';

function Assumptions() {
  const title = `Assumptions`;
  return (
    <SharedPageLayout title={title}>
      <AssumptionsPage />
    </SharedPageLayout>
  );
}

export default Assumptions;
