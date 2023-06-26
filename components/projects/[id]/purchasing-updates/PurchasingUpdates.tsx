import { Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import ContentLoader from 'components/common/ContentLoader';
import { PrintButton } from 'components/common/print/PrintButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import chartreuseClient from 'lib/chartreuseClient';
import type { ProjectContext } from 'lib/middleware/getProjectContext';

import { AddBlock, Placeholder } from '../additional-costs/components/ExpenseBlock';
import { useFooterState } from '../components/Footer';
import { SectionContainer } from '../projections/components/styles';
import { Wrapper } from '../styles';

import { EmptyState } from './components/EmptyState';
import type { PeriodOption } from './components/PercentTag';
import { PeriodSelect, getFriendlyPeriod } from './components/PercentTag';
import { UploadButton } from './components/UploadButton';
import { SingleUseActuals } from './single-use/SingleUseActuals';

export function PurchasingUpdates({ project }: { project: ProjectContext['project'] }) {
  const { setFooterState } = useFooterState();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null);

  const {
    data: inventory,
    mutate: refreshInventory,
    isValidating: isLoading
  } = useSWR(`/api/projects/${project.id}/inventory`, () => chartreuseClient.getProjectInventory(project.id), {
    revalidateOnFocus: false
  });
  const [clickedDownload, setClickedDownload] = useState(false);

  // for printing
  const printRef = useRef(null);

  useEffect(() => {
    setFooterState({ path: '/purchasing-updates', stepCompleted: true });
  }, [setFooterState]);

  function onUpload() {
    refreshInventory();
    chartreuseClient.sendMailchimpEvent('completed_purchasing_updates');
  }

  function clickDownload() {
    setClickedDownload(true);
  }

  const singleUseItemsWithRecords = inventory?.singleUseItems.filter(item => item.records.length);
  const hasInventory = Boolean(inventory?.singleUseItems?.length);
  const hasRecordsToShow = Boolean(singleUseItemsWithRecords?.length);

  const showEmptyState = !hasRecordsToShow && !clickedDownload;

  const friendlyPeriod = getFriendlyPeriod(selectedPeriod?.value);

  return (
    <Wrapper ref={printRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Purchasing updates</Typography.Title>
        <div style={{ display: 'flex', gap: '1em' }} className='dont-print-me'>
          {!isLoading && !showEmptyState && (
            <PrintButton printRef={printRef} pdfTitle={`${project.name} Purchasing Updates - Chart Reuse`} />
          )}
          {!isLoading && !showEmptyState && <UploadButton projectId={project.id} onUpload={onUpload} />}
        </div>
      </div>
      <Typography.Title level={5} className='dont-print-me'>
        Next: Track your purchasing history of single-use items. You can go back as far in your purchasing history as
        you’d like. You can use this section to compare your purchasing trends over time, and see if you’re on track
        with your forecasted goals.
      </Typography.Title>

      <br />
      {isLoading && <LoadingState />}
      {!isLoading && showEmptyState && !hasInventory && (
        <AddBlock>
          <Placeholder>Add Single Use items in Step 2 to enter purchasing updates.</Placeholder>
        </AddBlock>
      )}
      {!isLoading && showEmptyState && hasInventory && (
        <EmptyState projectId={project.id} onClickDownload={clickDownload} />
      )}
      {!isLoading && !showEmptyState && inventory && hasRecordsToShow && (
        <>
          <SectionContainer>
            <SingleUseActuals
              inventory={inventory}
              friendlyPeriod={friendlyPeriod}
              periodSelect={<PeriodSelect onChange={setSelectedPeriod} />}
            />
          </SectionContainer>
          {/* <SectionContainer>
            <div className="page-break" />
            <SectionHeader>Project impacts</SectionHeader>
            <Divider />
            <ProjectImpact inventory={inventory} dateRange={dateRange} />
            <SectionHeader>Environmental summary</SectionHeader>
            <EnvironmentalSummary />
            <Divider />
          </SectionContainer> */}
        </>
      )}
      {!isLoading && !showEmptyState && inventory && !hasRecordsToShow && (
        <AddBlock>
          <Placeholder>No records to display. Upload a purchasing tracking spreadsheet to add data.</Placeholder>
        </AddBlock>
      )}
    </Wrapper>
  );
}

function LoadingState() {
  return (
    <Wrapper>
      <ContentLoader />
    </Wrapper>
  );
}

// Tabs code, in case we need it:

// function Component() {

//   const router = useRouter()
//   const [activeKey, setActiveKey] = useState<string | undefined>(typeof router.query.tab === 'string' ? router.query.tab : undefined)

//   useEffect(() => {
//     if (typeof router.query.tab === 'string') {
//       setActiveKey(router.query.tab)
//     }
//   }, [router.query])

//   function changeTab(key: string) {
//     router.push(`/projects/${projectId}/actuals-tracking?tab=${key}`, undefined, { shallow: true })
//   }
//   const tabs = [
//     {
//       key: 'table',
//       label: 'Table',
//       children: !inventory || isLoadingInventory ? <LoadingState /> : <ProjectInventoryView projectId={projectId} inventory={inventory} onUpload={onUpload} />,
//     },
//     {
//       key: 'charts',
//       label: 'Charts',
//       disabled: !inventory?.hasRecords,
//       children: !actuals || isLoadingActuals ? <LoadingState /> : <ProjectActualsView actuals={actuals} />,
//     },
//   ]

//   return < Tabs
//     defaultActiveKey="table"
//     activeKey={activeKey}
//     onChange={changeTab}
//     items={tabs}
//     tabBarExtraContent={hasData && <InventoryButtons showClear={true} onUpload={onUpload} projectId={projectId} />
//     }
//   />
// }
