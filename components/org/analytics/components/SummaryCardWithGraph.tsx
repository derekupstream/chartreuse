import type { Org, User } from '@prisma/client';
import { Col, Row, Typography } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import Card from 'components/projects/[id]/projections/components/common/Card';
import GroupedBar from 'components/projects/[id]/projections/components/common/GroupedBar';
import type { SummaryValues, AllProjectsSummary } from 'lib/calculator/getProjections';
import { defaultFormatter } from '../utils';

const KPIValue = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 30px !important;
  @media print {
    font-size: 24px !important;
  }
`;

export interface PageProps {
  isUpstreamView?: boolean;
  user: User & { org: Org };
  data?: AllProjectsSummary;
  allAccounts?: { id: string; name: string }[];
  allProjects?: { id: string; accountId: string; name: string }[];
}

export const SummaryCardWithGraph = ({
  label,
  units,
  value,
  formatter = defaultFormatter
}: {
  label: string;
  units?: string;
  value: SummaryValues;
  formatter?: (val: number) => string | ReactNode;
}) => {
  const graphData = {
    baseline: value.baseline,
    forecast: value.forecast
  };

  const change = (value.forecast - value.baseline) * -1;

  return (
    <Card style={{ height: '100%' }}>
      <Row>
        <Col xs={24} sm={13}>
          <Typography.Paragraph>
            <strong>{label}</strong>
          </Typography.Paragraph>
          <KPIValue>
            {formatter(change)} <span style={{ fontSize: '.6em' }}>{units}</span>
          </KPIValue>
        </Col>
        <Col xs={24} sm={11}>
          <GroupedBar data={graphData} formatter={val => (val ? formatter(val) : val)} />
        </Col>
      </Row>
    </Card>
  );
};
