import { Wrapper } from '../styles'
import { Button, Typography } from 'antd'
import useSWR from 'swr'
import ContentLoader from 'components/content-loader'
import { useFooterState } from '../footer'
import { AddBlock, Placeholder } from '../additional-costs/components/expense-block'
import { PeriodSelect, PeriodOption, convertPeriodToDates } from './components/period-select'
import { useEffect, useRef, useState } from 'react'
import { Tabs } from 'antd'
import chartreuseClient from 'lib/chartreuseClient'
import { UploadButton } from './components/upload-button'
import { EmptyState } from './components/empty-state'
import type { ProjectContext } from 'lib/middleware/getProjectContext'
import { ActualsResponse } from 'lib/calculator/getActuals'
import { PrinterOutlined } from '@ant-design/icons'
import { CardTitle, Divider, SectionContainer, SectionHeader } from '../projections/components/styles'
import { SingleUseActuals } from './single-use/single-use-actuals'
import { ProjectImpact } from './project-impact/project-impact-actuals'
import { EnvironmentalSummary } from './project-impact/environmental-summary-actuals'
import { useReactToPrint } from 'react-to-print'
import { PrintHeader } from 'components/print/print-header'
import { ProjectInfo } from 'components/dashboard/styles'

export function PurchasingUpdates({ project }: { project: ProjectContext['project'] }) {
  const { setFooterState } = useFooterState()
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null)

  const {
    data: inventory,
    mutate: refreshInventory,
    isValidating: isLoading,
  } = useSWR(`/api/projects/${project.id}/inventory`, () => chartreuseClient.getProjectInventory(project.id), { revalidateOnFocus: false })
  const [clickedDownload, setClickedDownload] = useState(false)

  // for printing
  const componentRef = useRef(null)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${project.name} Purchasing Updates - Chart Reuse`,
    // onBeforeGetContent: () => {
    //   // remove the print button
    //   const printButton = content.querySelector('.print-button')
    //   printButton?.remove()
    // }

    // onAfterPrint: () => setPrinting(false),
    // make sure this returns a promise for the library
    // onBeforeGetContent: async () => {
    //   // Modify the page here, for example, by setting state:
    //   setPrinting(true);
    // }
  })

  useEffect(() => {
    setFooterState({ path: '/purchasing-updates', stepCompleted: true })
  }, [setFooterState])

  function onUpload() {
    refreshInventory()
  }

  function clickDownload() {
    setClickedDownload(true)
  }

  const singleUseItemsWithRecords = inventory?.singleUseItems.filter(item => item.records.length)
  const hasInventory = Boolean(inventory?.singleUseItems?.length)
  const hasRecordsToShow = Boolean(singleUseItemsWithRecords?.length)

  const showEmptyState = !hasRecordsToShow && !clickedDownload

  const dateRange = convertPeriodToDates(selectedPeriod?.value)

  return (
    <Wrapper ref={componentRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Purchasing updates</Typography.Title>
        <div style={{ display: 'flex', gap: '1em' }} className="dont-print-me">
          {!isLoading && !showEmptyState && (
            <Button onClick={handlePrint}>
              <PrinterOutlined /> Print
            </Button>
          )}
          {!isLoading && !showEmptyState && <UploadButton projectId={project.id} onUpload={onUpload} />}
        </div>
      </div>
      <Typography.Title level={5} className="dont-print-me">
        Next: Track your purchasing history of single-use items. You can go back as far in your purchasing history as you’d like. You can use this section to compare your purchasing trends over time,
        and see if you’re on track with your forecasted goals.
      </Typography.Title>

      <br />
      {isLoading && <LoadingState />}
      {!isLoading && showEmptyState && !hasInventory && (
        <AddBlock>
          <Placeholder>Add Single Use items in Step 2 to enter purchasing updates.</Placeholder>
        </AddBlock>
      )}
      {!isLoading && showEmptyState && hasInventory && <EmptyState projectId={project.id} onClickDownload={clickDownload} />}
      {!isLoading && !showEmptyState && inventory && hasRecordsToShow && (
        <>
          <SectionContainer>
            <SingleUseActuals inventory={inventory} periodSelect={<PeriodSelect onChange={setSelectedPeriod} />} />
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
  )
}

function LoadingState() {
  return (
    <Wrapper>
      <ContentLoader />
    </Wrapper>
  )
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
