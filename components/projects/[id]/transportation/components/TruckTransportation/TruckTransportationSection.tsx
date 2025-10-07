import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Drawer, message, Popconfirm, Row, Typography } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';

import { InfoCard, InfoRow } from '../../../styles';
import {
  AddBlock,
  Container,
  contentWrapperStyle,
  Placeholder,
  Subtitle
} from '../../../additional-costs/components/ExpenseBlock';
import { SectionContainer, SectionTitle } from '../../../additional-costs/components/styles';

import { TruckTransportationForm } from './TruckTransportationForm';
import {
  useAddOrUpdateTruckTransportationCost,
  useDeleteTruckTransportationCost,
  useGetTruckTransportationCosts
} from 'client/projects';
import { FormValues } from './TruckTransportationForm';

import { useMetricSystem } from 'components/_app/MetricSystemProvider';

export const TruckTransportationSection = ({ projectId, readOnly }: { projectId: string; readOnly: boolean }) => {
  const displayAsMetric = useMetricSystem();
  const { data, isLoading, mutate: refetchCosts } = useGetTruckTransportationCosts(projectId);
  const { trigger: addOrUpdateTruckTransportationCost } = useAddOrUpdateTruckTransportationCost(projectId);
  const { trigger: deleteTruckTransportationCost } = useDeleteTruckTransportationCost(projectId);
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const onAddExpense = () => {
    setIsDrawerVisible(true);
    setFormValues(null);
  };

  function onEdit(formValues: FormValues) {
    setFormValues(formValues);
    setIsDrawerVisible(true);
  }

  const onSubmitForm = ({ distanceInMiles }: FormValues) => {
    const values = {
      ...formValues,
      distanceInMiles
    };
    addOrUpdateTruckTransportationCost(values, {
      onSuccess: () => {
        if (formValues?.id) {
          message.success('Truck Transportation updated');
        } else {
          message.success('Truck Transportation created');
          setIsDrawerVisible(false);
        }
        refetchCosts();
      }
    });
  };

  const hideForm = () => {
    setIsDrawerVisible(false);
  };

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id };

    deleteTruckTransportationCost(reqBody, {
      onSuccess: () => {
        message.success('Truck Transportation deleted');
        refetchCosts();
      }
    });
  };

  if (isLoading) {
    return <ContentLoader />;
  }

  function displayDistance(distanceInMiles: number) {
    const distance = displayAsMetric ? distanceInMiles * 1.60934 : distanceInMiles;
    const distanceUnit = displayAsMetric ? 'km' : 'miles';
    return `${distance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${distanceUnit}`;
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Trucking Impact</SectionTitle>
        {!!data?.length && !readOnly && (
          <Button
            onClick={onAddExpense}
            icon={<PlusOutlined />}
            type='primary'
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add trip
          </Button>
        )}
      </SectionContainer>
      <Divider />
      {data?.length
        ? data.map(cost => (
            <InfoRow key={cost.id}>
              <Col span={8}>
                <Subtitle>{displayDistance(cost.distanceInMiles)}</Subtitle>
                {!readOnly && (
                  <>
                    <a
                      href='#'
                      onClick={e => {
                        onEdit(cost);
                        e.preventDefault();
                      }}
                    >
                      Edit
                    </a>
                    <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
                    <Popconfirm
                      title='Are you sure to delete this item?'
                      onConfirm={() => onConfirmDelete(cost.id)}
                      okText='Yes'
                      cancelText='No'
                    >
                      <a href='#'>Delete</a>
                    </Popconfirm>
                  </>
                )}
              </Col>
              <Col span={8}></Col>
              <Col span={8}>
                <InfoCard theme='forecast'>
                  <Typography.Title level={5}>Transportation</Typography.Title>
                  <table>
                    <thead>
                      <tr>
                        <td>Distance</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{cost.distanceInMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} miles</td>
                      </tr>
                    </tbody>
                  </table>
                </InfoCard>
              </Col>
            </InfoRow>
          ))
        : !readOnly && (
            <AddBlock>
              <Button
                onClick={onAddExpense}
                icon={<PlusOutlined />}
                type='primary'
                style={{ paddingRight: '4em', paddingLeft: '4em' }}
              >
                Add trip
              </Button>
              <Placeholder>You have no entries yet. Click &apos;+ Add trip&apos; above to get started.</Placeholder>
            </AddBlock>
          )}
      <Drawer
        title={`${formValues?.id ? 'Update' : 'Add'} off-site dishwashing transportation impact`}
        onClose={hideForm}
        open={isDrawerVisible}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <TruckTransportationForm input={formValues} onSubmit={onSubmitForm} />
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
