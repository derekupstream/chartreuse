import { BarChartOutlined, TableOutlined } from '@ant-design/icons'
import { Radio, Table, Typography, Menu, Dropdown } from 'antd'
import Spacer from 'components/spacer/spacer'
import { CardTitle, ChartTitle, Divider, SectionContainer, SectionHeader } from '../components/styles'
import Tag from '../components/tag'
import { Card, Body, Section, Header, Value, Row, Label } from './styles'

interface TableData {
  id: string
  product: string
  baselineSpending: number
  forecastSpending: number
  change: string
}

const dataSource: TableData[] = [
  {
    id: '1',
    product: '8oz. plastic #1 PET cold cup',
    baselineSpending: 98.297,
    forecastSpending: 98.297,
    change: '-$42,193 (-50 %)',
  },
  {
    id: '2',
    product: '16oz. plastic #1 PET cold cup',
    baselineSpending: 32.0,
    forecastSpending: 33.111,
    change: '-$42,193 (-37 %)',
  },
  {
    id: '3',
    product: '1qt. paper lid',
    baselineSpending: 3.999,
    forecastSpending: 7.5,
    change: '-$2,00 (-12 %)',
  },
]

const columns = [
  {
    title: 'Product',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Baseline spending',
    dataIndex: 'baselineSpending',
    key: 'baselineSpending',
  },
  {
    title: 'Forecast spending',
    dataIndex: 'forecastSpending',
    key: 'forecastSpending',
  },
  {
    title: 'Change',
    dataIndex: 'change',
    key: 'change',
  },
]

const SingleUseDetails = () => {
  return (
    <SectionContainer>
      <SectionHeader>Single-use details report for Redding Cafe West </SectionHeader>
      <Divider />
      <Card>
        <CardTitle>Your estimated annual savings</CardTitle>
        <Body>
          <Section>
            <Header>
              <Value>$175,817</Value> <Tag>79%</Tag>
            </Header>
            <ChartTitle>Annual Spending changes</ChartTitle>
            {/* <ChartBar data={mockedChartBarData} /> */}
          </Section>

          <Section>
            <Header>
              <Value>$175,817</Value> <Tag>79%</Tag>
            </Header>
            <ChartTitle>Annual single-use total changes</ChartTitle>
            {/* <ChartBar data={mockedChartBarData} /> */}
          </Section>
        </Body>
      </Card>

      <SectionHeader>Single-use purchasing</SectionHeader>
      <Divider />
      <Card>
        <Row spaceBetween>
          <CardTitle>Cost</CardTitle>
          <Row marginBottom={15}>
            <Label>View change in</Label>
            <Radio.Group defaultValue="cost" buttonStyle="solid" onChange={console.log}>
              <Radio.Button value="cost">Cost</Radio.Button>
              <Radio.Button value="waste">Waste</Radio.Button>
              <Radio.Button value="ghg">GHG</Radio.Button>
            </Radio.Group>
            <Spacer horizontal={16} />
            <Radio.Group defaultValue="waste" buttonStyle="solid" onChange={console.log}>
              <Radio.Button value="waste">
                <BarChartOutlined />
              </Radio.Button>
              <Radio.Button value="ghg">
                <TableOutlined />
              </Radio.Button>
            </Radio.Group>
          </Row>
        </Row>

        <Row marginBottom={16} spaceBetween>
          <Row>
            <Label>View results by</Label>
            <Radio.Group defaultValue="product" buttonStyle="solid" onChange={console.log}>
              <Radio.Button value="product">Product</Radio.Button>
              <Radio.Button value="category">Category</Radio.Button>
              <Radio.Button value="material">Materal</Radio.Button>
            </Radio.Group>
            <Spacer horizontal={16} />
            <Radio.Group defaultValue="pounds" buttonStyle="solid" onChange={console.log}>
              <Radio.Button value="pounds">Pounds</Radio.Button>
              <Radio.Button value="tons">Tons</Radio.Button>
            </Radio.Group>
          </Row>

          <div>
            Sort By:
            <Dropdown.Button
              onClick={console.log}
              overlay={
                <Menu onClick={console.log}>
                  <Menu.Item key="1">1st menu item</Menu.Item>
                  <Menu.Item key="2">2nd menu item</Menu.Item>
                  <Menu.Item key="3">3rd menu item</Menu.Item>
                </Menu>
              }
            >
              Dropdown
            </Dropdown.Button>
          </div>
        </Row>
        <Spacer horizontal={16} />
        <Table<TableData>
          dataSource={dataSource}
          columns={columns}
          summary={pageData => {
            const baselineTotal = pageData.reduce((acc, curr) => acc + curr.baselineSpending, 0)
            const forecastTotal = pageData.reduce((acc, curr) => acc + curr.forecastSpending, 0)

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Typography.Text strong>{baselineTotal}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Typography.Text strong>{forecastTotal}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Typography.Text strong>{forecastTotal}</Typography.Text>
                  <Tag>76%</Tag>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </SectionContainer>
  )
}

export default SingleUseDetails
