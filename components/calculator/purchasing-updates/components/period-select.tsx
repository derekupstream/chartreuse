import { Form, Select } from 'antd'
import { DateRange } from 'lib/calculator/types'
import * as date from 'date-fns'

type PeriodValue = 'all_time' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year'
export type PeriodOption = { label: string; value: PeriodValue }

const periodOptions: PeriodOption[] = [
  {
    label: 'All time',
    value: 'all_time',
  },
  {
    label: 'This quarter',
    value: 'this_quarter',
  },
  {
    label: 'Last quarter',
    value: 'last_quarter',
  },
  {
    label: 'This year',
    value: 'this_year',
  },
  {
    label: 'Last year',
    value: 'last_year',
  },
]

// a function that converts a period value to a date range
export function convertPeriodToDates(period: PeriodValue | undefined): DateRange {
  const today = new Date()
  const start = date.startOfQuarter(today)
  const end = date.endOfQuarter(today)
  switch (period) {
    case 'this_quarter':
      return { start, end }
    case 'last_quarter':
      return { start: date.subQuarters(start, 1), end: date.subQuarters(end, 1) }
    case 'this_year':
      return { start: date.startOfYear(today), end: date.endOfYear(today) }
    case 'last_year':
      return { start: date.subYears(date.startOfYear(today), 1), end: date.subYears(date.endOfYear(today), 1) }
    default:
      return {}
  }
}

export function PeriodSelect({ onChange }: { onChange: (value: PeriodOption) => void }) {
  function _onChange(_: PeriodValue, option: PeriodOption | PeriodOption[]) {
    onChange(option as PeriodOption)
  }
  return (
    <Form.Item label="Time period:" style={{ margin: 0, minWidth: 210 }}>
      <Select defaultValue="all_time" onChange={_onChange} options={periodOptions} />
    </Form.Item>
  )
}
