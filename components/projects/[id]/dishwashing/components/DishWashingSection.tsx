import { PlusOutlined } from '@ant-design/icons';
import type { Dishwasher } from '@prisma/client';
import { Button, Col, Divider, Drawer, message, Popconfirm, Typography, Popover } from 'antd';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import ContentLoader from 'components/common/ContentLoader';
import { useSimpleMutation } from 'hooks/useSimpleQuery';
import { useSimpleQuery } from 'hooks/useSimpleQuery';
import * as http from 'lib/http';
import type { Response } from 'pages/api/dishwashers/index';

import { InfoCard, InfoRow } from '../../styles';
import {
  AddBlock,
  Container,
  contentWrapperStyle,
  Placeholder,
  Subtitle
} from '../../additional-costs/components/ExpenseBlock';

import DishwashingBaselineForm from './DishWashingBaselineForm';
import type { DishwasherData as BaselineFormValues } from './DishWashingBaselineForm';
import DishwashingForecastForm from './DishWashingForecastForm';
import type { DishwasherData as ForecastFormValues } from './DishWashingForecastForm';

const DishWashingSection = ({ projectId, readOnly }: { projectId: string; readOnly: boolean }) => {
  const route = useRouter();
  const { data, isLoading, refetch } = useSimpleQuery<Response>(`/api/dishwashers?projectId=${projectId}`);
  const createDishwashingCost = useSimpleMutation('/api/dishwashers', 'POST');

  const [visibleForm, setVisibleForm] = useState<'baseline' | 'forecast' | null>(null);
  const [formState, setFormState] = useState<(BaselineFormValues & ForecastFormValues) | null>(null);

  function onClickCreate() {
    setFormState(null);
    setVisibleForm('baseline');
  }

  function onClickEdit(item: Dishwasher) {
    setFormState(item);
    setVisibleForm('baseline');
  }

  function onClose() {
    setFormState(null);
    setVisibleForm(null);
  }

  function onSubmitBaseline(newValues: BaselineFormValues) {
    setFormState(current => ({ ...(current || {}), ...newValues }));
    setVisibleForm('forecast');
  }

  function onSubmitForecast(newValues: ForecastFormValues) {
    const values = {
      ...formState,
      ...newValues
    };

    createDishwashingCost.mutate(values, {
      onSuccess: onSubmit
    });
  }

  function onSubmit() {
    if (formState?.id) {
      message.success('Dishwasher updated');
    } else {
      message.success('Dishwasher created');
    }
    onClose();
    refetch();
  }

  const onConfirmDelete = () => {
    http.DELETE(`/api/dishwashers`, { projectId: projectId }).then(() => {
      message.success('Dishwasher deleted');
      refetch();
    });
  };

  const prettifyValues = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

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
              /thousand gallons)
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
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Dishwashing</Typography.Title>
        {!!data?.dishwashers?.length && !readOnly && (
          <Button
            onClick={onClickCreate}
            icon={<PlusOutlined />}
            type='primary'
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add dishwasher
          </Button>
        )}
      </div>
      <Typography.Title level={5}>
        Use this section to help calculate dishwashing energy and water costs. Energy and water rates are based on your{' '}
        <Popover content={utilities.content} title={utilities.title} trigger='hover'>
          <Typography.Link underline href={!readOnly ? `/projects/${projectId}/edit?redirect=${route.asPath}` : ''}>
            {data?.state ? 'state average' : 'custom rates'}
          </Typography.Link>
        </Popover>
        .
      </Typography.Title>
      <br />
      {(data?.dishwashers ?? []).map(({ stats, dishwasher }) => (
        <InfoRow key={dishwasher.id}>
          <Col span={8} flex-direction='column'>
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
          <Col span={8}>
            <InfoCard theme='baseline'>
              <Typography.Title level={5}>Baseline</Typography.Title>
              <table>
                <thead>
                  <tr>
                    <td>Annual usage</td>
                    <td>CO2 (lbs/yr)</td>
                    <td>Annual cost</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{prettifyValues(stats.electricUsage.baseline)} kWh</td>
                    <td>{prettifyValues(stats.electricCO2Weight.baseline)}</td>
                    <td>
                      <CurrencySymbol value={stats.electricCost.baseline} />
                    </td>
                  </tr>
                  <tr>
                    <td>{stats.gasUsage.baseline.toLocaleString(undefined, { maximumFractionDigits: 2 })} CF</td>
                    <td>{prettifyValues(stats.gasCO2Weight.baseline)}</td>
                    <td>
                      <CurrencySymbol value={stats.gasCost.baseline} />
                    </td>
                  </tr>
                  <tr>
                    <td>{stats.waterUsage.baseline.toLocaleString(undefined, { maximumFractionDigits: 2 })} gal</td>
                    <td></td>
                    <td>
                      <CurrencySymbol value={stats.waterCost.baseline} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </InfoCard>
          </Col>
          <Col span={8}>
            <InfoCard theme='forecast'>
              <Typography.Title level={5}>Forecast</Typography.Title>
              <table>
                <thead>
                  <tr>
                    <td>Annual usage</td>
                    <td>CO2 (lbs/yr)</td>
                    <td>Annual cost</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{prettifyValues(stats.electricUsage.forecast)} kWh</td>
                    <td>{prettifyValues(stats.electricCO2Weight.forecast)}</td>
                    <td>
                      <CurrencySymbol value={stats.electricCost.forecast} />
                    </td>
                  </tr>
                  <tr>
                    <td>{stats.gasUsage.forecast.toLocaleString(undefined, { maximumFractionDigits: 2 })} CF</td>
                    <td>{prettifyValues(stats.gasCO2Weight.forecast)}</td>
                    <td>
                      <CurrencySymbol value={stats.gasCost.forecast} />
                    </td>
                  </tr>
                  <tr>
                    <td>{stats.waterUsage.forecast.toLocaleString(undefined, { maximumFractionDigits: 2 })} gal</td>
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
            <Button
              onClick={onClickCreate}
              icon={<PlusOutlined />}
              type='primary'
              style={{ paddingRight: '4em', paddingLeft: '4em' }}
            >
              Add dishwasher
            </Button>
            <Placeholder>
              You have no dishwashing entries yet. Click &apos;+ Add dishwashing&apos; above to get started.
            </Placeholder>
          </AddBlock>
        </>
      )}
      <Drawer
        title={formState?.id ? 'Update current dishwashing expense' : 'Add current dishwashing expense'}
        onClose={onClose}
        open={visibleForm === 'baseline'}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <DishwashingBaselineForm input={formState} onSubmit={onSubmitBaseline} />
      </Drawer>
      <Drawer
        title={formState?.id ? 'Update dishwashing forecast' : 'Add dishwashing forecast'}
        onClose={onClose}
        open={visibleForm === 'forecast'}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <DishwashingForecastForm input={formState} onSubmit={onSubmitForecast} />
      </Drawer>
    </Container>
  );
};

const Options = styled.span`
  font-size: 14px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
`;

export default DishWashingSection;
