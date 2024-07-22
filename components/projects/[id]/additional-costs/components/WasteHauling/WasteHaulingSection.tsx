import { PlusOutlined } from '@ant-design/icons';
import type { WasteHaulingCost } from '@prisma/client';
import { Button, Col, Divider, Drawer, message, Popconfirm, Row, Typography } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery';
import { formatToDollar } from 'lib/calculator/utils';
import type { WasteHaulingService } from 'lib/inventory/types/projects';

import { InfoCard, InfoRow } from '../../../styles';
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../ExpenseBlock';
import { SectionContainer, SectionData, SectionTitle } from '../styles';

import WasteHaulingBaselineForm from './WasteHaulingBaselineForm';
import WasteHaulingForecastForm from './WasteHaulingForecastForm';

const annual = 12;

interface Response {
  wasteHaulingCosts: WasteHaulingCost[];
}

const WasteHaulingSection = ({ projectId, readOnly }: { projectId: string; readOnly: boolean }) => {
  const url = `/api/waste-hauling/?projectId=${projectId}`;
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url);
  const deleteWasteHauling = useSimpleMutation(url, 'DELETE');
  const createWasteHaulingCost = useSimpleMutation(url, 'POST');
  const [formValues, setFormValues] = useState<WasteHaulingService | null>(null);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isSecondDrawerVisible, setIsSecondDrawerVisible] = useState(false);

  const onAddExpense = () => {
    setIsDrawerVisible(true);
    setFormValues(null);
  };

  function onEdit(formValues: WasteHaulingService) {
    setFormValues(formValues);
    setIsDrawerVisible(true);
  }

  const onCloseFirstForm = (_formValues?: WasteHaulingService) => {
    if (_formValues) setFormValues(current => ({ ...current, ..._formValues }));
    setIsDrawerVisible(false);
    setIsSecondDrawerVisible(true);
  };

  const onCloseSecondForm = (newMonthlyCost: number) => {
    const values = {
      ...formValues,
      newMonthlyCost
    };
    createWasteHaulingCost.mutate(values, {
      onSuccess: onSuccessSecondFormSubmit
    });
  };

  const onCloseForms = () => {
    setIsDrawerVisible(false);
    setIsSecondDrawerVisible(false);
  };

  const onSuccessSecondFormSubmit = () => {
    if (formValues?.id) {
      message.success('Waste Hauling updated');
    } else {
      message.success('Waste Hauling created');
    }
    setIsSecondDrawerVisible(false);
    refetch();
  };

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id };

    deleteWasteHauling.mutate(reqBody, {
      onSuccess: () => {
        message.success('Waste Hauling deleted');
        refetch();
      }
    });
  };

  if (isLoading) {
    return <ContentLoader />;
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Waste Hauling</SectionTitle>
        {!!data?.wasteHaulingCosts?.length && !readOnly && (
          <Button
            onClick={onAddExpense}
            icon={<PlusOutlined />}
            type='primary'
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add waste hauling cost
          </Button>
        )}
      </SectionContainer>
      <Divider />
      {data?.wasteHaulingCosts?.length
        ? data.wasteHaulingCosts.map(wasteHauling => (
            <InfoRow key={wasteHauling.id}>
              <Col span={8}>
                <Subtitle>{wasteHauling.serviceType}</Subtitle>
                {!readOnly && (
                  <>
                    <a
                      href='#'
                      onClick={e => {
                        onEdit(wasteHauling as WasteHaulingService);
                        e.preventDefault();
                      }}
                    >
                      Edit
                    </a>
                    <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
                    <Popconfirm
                      title='Are you sure to delete this item?'
                      onConfirm={() => onConfirmDelete(wasteHauling.id)}
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
                        <td>Collection frequency</td>
                        <td>Monthly total</td>
                        <td>Annual total</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Monthly</td>
                        <td>{formatToDollar(wasteHauling.monthlyCost)}</td>
                        <td>{formatToDollar(wasteHauling.monthlyCost * annual)}</td>
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
                        <td>Collection frequency</td>
                        <td>Monthly total</td>
                        <td>Annual total</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Monthly</td>
                        <td>{formatToDollar(wasteHauling.newMonthlyCost)}</td>
                        <td>{formatToDollar(wasteHauling.newMonthlyCost * annual)}</td>
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
                Add waste hauling cost
              </Button>
              <Placeholder>
                You have no waste hauling entries yet. Click &apos;+ Add waste hauling cost&apos; above to get started.
              </Placeholder>
            </AddBlock>
          )}
      <Drawer
        title={`${formValues?.id ? 'Update' : 'Add'} current monthly waste hauling service fees`}
        onClose={onCloseForms}
        open={isDrawerVisible}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <WasteHaulingBaselineForm input={formValues} onClose={onCloseFirstForm} />
      </Drawer>
      <Drawer
        title={`${formValues?.id ? 'Update' : 'Add'} the forecast for monthly waste hauling service fees`}
        onClose={onCloseForms}
        open={isSecondDrawerVisible}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <WasteHaulingForecastForm input={formValues} onClose={onCloseSecondForm} />
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

export default WasteHaulingSection;
