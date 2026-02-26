import { PlusOutlined } from '@ant-design/icons';
import type { Dishwasher, ProjectCategory } from '@prisma/client';
import { Button, Col, Drawer, message, Popconfirm, Typography, Popover } from 'antd';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';
import { formatNumber, valueInPounds } from 'lib/number';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import ContentLoader from 'components/common/ContentLoader';
import { useSimpleMutation } from 'hooks/useSimpleQuery';
import { useSimpleQuery } from 'hooks/useSimpleQuery';
import * as http from 'lib/http';
import type { Response } from 'pages/api/dishwashers/index';

import { InfoCard, InfoRow, StepDescription } from '../../styles';
import {
  AddBlock,
  Container,
  contentWrapperStyle,
  Placeholder,
  Subtitle
} from '../../additional-costs/components/ExpenseBlock';

import { DishwashingForm } from './DishWashingForm';
import type { DishwasherData as FormValues } from './DishWashingForm';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { convertAndFormatGallons } from 'lib/number';

export function DishWashingSection({
  projectId,
  readOnly,
  projectCategory
}: {
  projectId: string;
  readOnly: boolean;
  projectCategory: ProjectCategory;
}) {
  const route = useRouter();
  const { data, isLoading, refetch } = useSimpleQuery<Response>(`/api/dishwashers?projectId=${projectId}`);
  const createDishwashingCost = useSimpleMutation('/api/dishwashers', 'POST');
  const displayAsMetric = useMetricSystem();

  const [visibleForm, setVisibleForm] = useState<boolean>(false);
  const [formState, setFormState] = useState<FormValues | null>(null);

  function onClickCreate() {
    setFormState(null);
    setVisibleForm(true);
  }

  function onClickEdit(item: Dishwasher) {
    setFormState(item);
    setVisibleForm(true);
  }

  function onClose() {
    setFormState(null);
    setVisibleForm(false);
  }

  function onSubmit(newValues: FormValues) {
    setFormState(current => ({ ...(current || {}), ...newValues }));
    const values = {
      ...formState,
      ...newValues
    };

    createDishwashingCost.mutate(values, {
      onSuccess: function (e: any) {
        // TODO: figure out why error trigglers onSuccess // get rid of useSimpleMutation
        if (e.message) {
          console.error(e);
          message.error('Something went wrong, please check the inputs and try again.');
          return;
        }
        if (formState?.id) {
          message.success('Dishwasher updated');
        } else {
          message.success('Dishwasher created');
        }
        onClose();
        refetch();
      }
    });
  }

  const onConfirmDelete = () => {
    http.DELETE(`/api/dishwashers`, { projectId: projectId }).then(() => {
      message.success('Dishwasher deleted');
      refetch();
    });
  };

  if (isLoading) {
    return <ContentLoader />;
  }

  const utilities = {
    title: `Utility rates ${data?.state ? ` for ${data.state}` : ''}`,
    content: (
      <>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Electric{' '}
            <span style={{ color: 'grey' }}>
              ( <CurrencySymbol />
              /kWh)
            </span>
            :
          </span>
          <span>
            <CurrencySymbol />
            {data?.rates?.electric.toFixed(2)}
          </span>
        </Typography.Paragraph>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Gas{' '}
            <span style={{ color: 'grey' }}>
              ( <CurrencySymbol />
              /therm)
            </span>
            :
          </span>
          <span>
            <CurrencySymbol />
            {data?.rates?.gas.toFixed(2)}
          </span>
        </Typography.Paragraph>
        <Typography.Paragraph style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ paddingRight: '1em' }}>
            Water{' '}
            <span style={{ color: 'grey' }}>
              ( <CurrencySymbol />
              /thousand {displayAsMetric ? 'liters' : 'gallons'})
            </span>
            :
          </span>
          <span>
            {' '}
            <CurrencySymbol />
            {data?.rates?.water.toFixed(2)}
          </span>
        </Typography.Paragraph>
        {!readOnly && (
          <Typography.Link
            style={{ fontSize: 12 }}
            underline
            type='secondary'
            href={`/projects/${projectId}/edit?redirect=${route.asPath}`}
          >
            Edit Utility Rates for this project
          </Typography.Link>
        )}
      </>
    )
  };

  return (
    <Container>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <Typography.Title level={1} style={{ margin: 0 }}>
          Dishwashing
        </Typography.Title>
        {!!data?.dishwashers?.length && !readOnly && (
          <Button onClick={onClickCreate} icon={<PlusOutlined />} type='primary'>
            Add dishwasher
          </Button>
        )}
      </div>
      <StepDescription>
        Use this section to help calculate dishwashing energy and water costs. Energy and water rates are based on your{' '}
        <Popover content={utilities.content} title={utilities.title} trigger='hover'>
          <Typography.Link underline href={!readOnly ? `/projects/${projectId}/edit?redirect=${route.asPath}` : ''}>
            {data?.state ? 'state average' : 'custom rates'}
          </Typography.Link>
        </Popover>
        .
      </StepDescription>
      <br />
      {(data?.dishwashers ?? []).map(({ stats, dishwasher }) => (
        <InfoRow key={dishwasher.id}>
          <Col xs={24} md={8}>
            <Subtitle style={{ margin: 0 }}>{dishwasher.type}</Subtitle>
            <Options>
              {dishwasher.temperature ? dishwasher.temperature + ' Temperature, ' : ''}
              {dishwasher.energyStarCertified ? 'Energy star certified' : null} {dishwasher.boosterWaterHeaterFuelType}{' '}
              Fuel
            </Options>
            <br />
            <br />
            {!readOnly && (
              <>
                <a
                  href='#'
                  onClick={e => {
                    onClickEdit(dishwasher);
                    e.preventDefault();
                  }}
                >
                  Edit
                </a>
                <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
                <Popconfirm
                  title='Are you sure to delete this item?'
                  onConfirm={onConfirmDelete}
                  okText='Yes'
                  cancelText='No'
                >
                  <a href='#'>Delete</a>
                </Popconfirm>
              </>
            )}
          </Col>
          <Col xs={0} md={8}></Col>
          <Col xs={24} md={8}>
            <InfoCard theme='forecast'>
              {/* <Typography.Title level={5}>Forecast</Typography.Title> */}
              <table>
                <thead>
                  <tr>
                    <td>Annual usage</td>
                    <td>CO2 ({displayAsMetric ? 'kg' : 'lbs'}/yr)</td>
                    <td>Annual cost</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatNumber(stats.electricUsage.forecast)} kWh</td>
                    <td>{formatNumber(valueInPounds(stats.electricCO2Weight.forecast, { displayAsMetric }))}</td>
                    <td>
                      <CurrencySymbol value={stats.electricCost.forecast} />
                    </td>
                  </tr>
                  <tr>
                    <td>{stats.gasUsage.forecast.toLocaleString(undefined, { maximumFractionDigits: 2 })} CF</td>
                    <td>{formatNumber(valueInPounds(stats.gasCO2Weight.forecast, { displayAsMetric }))}</td>
                    <td>
                      <CurrencySymbol value={stats.gasCost.forecast} />
                    </td>
                  </tr>
                  <tr>
                    <td>{convertAndFormatGallons(stats.waterUsage.forecast, { displayAsMetric })}</td>
                    <td></td>
                    <td>
                      <CurrencySymbol value={stats.waterCost.forecast} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </InfoCard>
          </Col>
        </InfoRow>
      ))}
      {(!data || data?.dishwashers?.length === 0) && !readOnly && (
        <>
          <AddBlock>
            <Button onClick={onClickCreate} icon={<PlusOutlined />} type='primary'>
              Add dishwasher
            </Button>
            <Placeholder>
              You have no dishwashing entries yet. Click &apos;+ Add dishwashing&apos; above to get started.
            </Placeholder>
          </AddBlock>
        </>
      )}
      <Drawer
        title={formState?.id ? 'Update dishwashing expense' : 'Add dishwashing expense'}
        onClose={onClose}
        open={visibleForm}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <DishwashingForm input={formState} onSubmit={onSubmit} showUsage={projectCategory !== 'event'} />
      </Drawer>
    </Container>
  );
}

const Options = styled.span`
  font-size: 14px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
`;
