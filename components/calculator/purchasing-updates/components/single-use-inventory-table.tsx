import { Typography, Table, TableColumnsType } from 'antd'
import Card from 'components/calculator/projections/components/card'
import { TitleRow } from '../../styles'
import { SingleUseLineItemRecord, SingleUseLineItemPopulated } from 'lib/inventory/types/projects'
import { formatToDollar } from 'lib/calculator/utils'
import { formatDateShort } from 'lib/dates'
import styled from 'styled-components'
import { ChartTitle } from 'components/calculator/projections/environmental/components/styles'

const StyledCard = styled(Card)`
  .ant-table-expanded-row {
    > .ant-table-cell {
      padding-right: 0;
    }
    .ant-table {
      background: none;
    }
    td {
      padding-top: 0.5em;
      padding-bottom: 0.5em;
    }
  }
`

const ExpandedRow = styled.div`
  display: flex;
  justify-content: space-between;
`

const recordColumns: TableColumnsType<SingleUseLineItemRecord> = [
  {
    title: 'Cases',
    key: 'caseCount',
    width: 80,
    render: (record: SingleUseLineItemRecord) => {
      return (
        <>
          <Typography.Text>{record.casesPurchased}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Units/Case',
    key: 'unitsPerCase',
    width: 120,
    render: (record: SingleUseLineItemRecord) => {
      return (
        <>
          <Typography.Text>{record.unitsPerCase}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Cost',
    key: 'totalCost',
    width: 120,
    render: (record: SingleUseLineItemRecord) => {
      return (
        <>
          <Typography.Text>{formatToDollar(record.totalCost)}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Date',
    key: 'date',
    width: 100,
    render: (record: SingleUseLineItemRecord) => {
      return (
        <>
          <Typography.Text>{!record.entryDate.includes('Z') ? <em>({record.entryDate})</em> : formatDateShort(new Date(record.entryDate))}</Typography.Text>
        </>
      )
    },
  },
]

function expandedRowRender(item: SingleUseLineItemPopulated) {
  const baselineItem: SingleUseLineItemRecord = {
    ...item,
    entryDate: item.frequency,
  }
  const records = [...item.records]
  if (records.length > 0) {
    records.push(baselineItem)
  }
  return (
    <ExpandedRow>
      <div style={{ width: 250 }}>
        <ChartTitle style={{ margin: 0 }}>Actuals history</ChartTitle>
        {item.records[0] && (
          <Typography.Paragraph style={{ fontSize: 12 }}>
            <em>Last entry: {formatDateShort(new Date(item.records[0].entryDate))} </em>
          </Typography.Paragraph>
        )}
      </div>
      <Table<SingleUseLineItemRecord> style={{ width: 410 }} dataSource={records} columns={recordColumns} pagination={false} showHeader={false} rowKey="id" />
    </ExpandedRow>
  )
}

const columns: TableColumnsType<SingleUseLineItemPopulated> = [
  {
    title: 'Category',
    key: 'categoryName',
    width: 140,
    render: (record: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{record.categoryName}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Item',
    key: 'description',
    width: 500,
    render: (record: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{record.product.description}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Cases',
    key: 'caseCount',
    width: 80,
    render: (item: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{item.records[0]?.casesPurchased ?? item.casesPurchased}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Units/Case',
    key: 'unitsPerCase',
    width: 80,
    render: (item: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{item.records[0]?.unitsPerCase ?? item.unitsPerCase}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Cost',
    key: 'totalCost',
    width: 120,
    render: (item: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{formatToDollar(item.records[0]?.totalCost ?? item.totalCost)}</Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Date',
    key: 'date',
    width: 100,
    render: (item: SingleUseLineItemPopulated) => {
      return (
        <>
          <Typography.Text>{item.records[0] ? formatDateShort(new Date(item.records[0].entryDate)) : <em>({item.frequency})</em>}</Typography.Text>
        </>
      )
    },
  },
]

export function SingleUseInventoryTable({ items }: { items: SingleUseLineItemPopulated[] }) {
  return (
    <StyledCard>
      <TitleRow style={{ marginTop: 0 }}>
        <Typography.Title level={3}>Single Use Items</Typography.Title>
      </TitleRow>
      <br />
      <Table<SingleUseLineItemPopulated> dataSource={items} columns={columns} expandable={{ expandedRowRender, expandRowByClick: true }} rowKey="id" />
    </StyledCard>
  )
}
