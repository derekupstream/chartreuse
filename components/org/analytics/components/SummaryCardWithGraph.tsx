import type { Org, User } from '@prisma/client';
import { Col, Row, Typography } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import Card from 'components/projects/[id]/projections/components/common/Card';
import GroupedBar from 'components/projects/[id]/projections/components/common/GroupedBar';
import type { SummaryValues, AllProjectsSummary } from 'lib/calculator/getProjections';
import { defaultFormatter } from '../utils';
import { SingleUseItemBar } from 'components/projects/[id]/projections/components/common/SingleUseItemBar';

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
  projectHasData,
  isEventProject,
  units,
  value,
  formatter = defaultFormatter,
  reverseChangePercent
}: {
  label: string;
  projectHasData: boolean;
  isEventProject: boolean;
  units?: string;
  value: SummaryValues;
  reverseChangePercent?: boolean;
  formatter?: (val: number) => string | ReactNode;
}) => {
  const graphData = {
    baseline: value.baseline,
    forecast: value.forecast
  };

  const change = (value.forecast - value.baseline) * (reverseChangePercent ? 1 : -1);

  return (
    <Card style={{ height: '100%' }}>
      <Row>
        <Col xs={24} sm={13}>
          <Typography.Paragraph>
            <strong>{label}</strong>
          </Typography.Paragraph>
          <KPIValue>
            {projectHasData ? (
              <>
                {formatter(change)} <span style={{ fontSize: '.6em' }}>{units}</span>
              </>
            ) : (
              'N/A'
            )}
          </KPIValue>
        </Col>
        <Col xs={24} sm={11}>
          {projectHasData ? (
            <GroupedBar
              isEventProject={isEventProject}
              data={graphData}
              formatter={val => (val ? formatter(val) : val)}
            />
          ) : (
            <div />
          )}
        </Col>
      </Row>
    </Card>
  );
};

export const SummaryCard = ({
  label,
  projectHasData,
  units,
  value
}: {
  label: string;
  projectHasData: boolean;
  units?: string;
  value: string;
}) => {
  return (
    <Card style={{ height: '100%' }}>
      <Typography.Paragraph>
        <strong>{label}</strong>
      </Typography.Paragraph>
      <KPIValue>
        {projectHasData ? (
          <>
            {value} {units && <span style={{ fontSize: '.6em' }}>{units}</span>}
          </>
        ) : (
          'N/A'
        )}
      </KPIValue>
    </Card>
  );
};

export const SummaryCardSingleUseBreakdown = ({
  label,
  projectHasData,
  bottleAvoided,
  foodwareItemsAvoided
}: {
  label: string;
  projectHasData: boolean;
  bottleAvoided: number;
  foodwareItemsAvoided: number;
}) => {
  const totalItemsAvoided = bottleAvoided + foodwareItemsAvoided;
  return (
    <Card style={{ height: '100%' }}>
      <Row>
        <Col xs={24} sm={13}>
          <Typography.Paragraph>
            <strong>{label}</strong>
          </Typography.Paragraph>
          <KPIValue>
            {projectHasData ? (
              <>
                {defaultFormatter(totalItemsAvoided)} <span style={{ fontSize: '.6em' }}>items</span>
              </>
            ) : (
              'N/A'
            )}
          </KPIValue>
        </Col>
        <Col xs={24} sm={11}>
          {projectHasData ? (
            <SingleUseItemBar
              data={{ bottles: bottleAvoided, foodware: foodwareItemsAvoided }}
              formatter={(datum: any) => datum.toLocaleString()}
            />
          ) : (
            <div />
          )}
        </Col>
      </Row>
    </Card>
  );
};
