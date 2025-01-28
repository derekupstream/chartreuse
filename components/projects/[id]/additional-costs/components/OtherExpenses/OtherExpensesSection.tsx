import { PlusOutlined } from '@ant-design/icons';
import type { OtherExpense } from '@prisma/client';
import { Button, Col, Divider, Drawer, message, Popconfirm, Typography } from 'antd';
import { useState } from 'react';

import CurrencySymbol from 'components/_app/CurrencySymbol';
import ContentLoader from 'components/common/ContentLoader';
import { useSimpleMutation, useSimpleQuery } from 'hooks/useSimpleQuery';
import { OTHER_EXPENSES_FREQUENCIES } from 'lib/calculator/constants/other-expenses';

import { InfoCard, InfoRow } from '../../../styles';
import { AddBlock, Container, contentWrapperStyle, Placeholder, Subtitle } from '../ExpenseBlock';
import { SectionContainer, SectionTitle } from '../styles';

import OtherExpensesFormDrawer from './OtherExpensesFormDrawer';

type Response = {
  otherExpenses: OtherExpense[];
};

const OtherExpenseSection = ({ projectId, readOnly }: { projectId: string; readOnly: boolean }) => {
  const url = `/api/other-expenses/?projectId=${projectId}`;
  const { data, isLoading, refetch } = useSimpleQuery<Response>(url);
  const deleteOtherExpenses = useSimpleMutation(url, 'DELETE');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [activeOtherExpense, setActiveOtherExpense] = useState<OtherExpense | null>(null);

  const onAddExpense = () => {
    setIsDrawerVisible(true);
    setActiveOtherExpense(null);
  };

  function onEdit(additionalCost: OtherExpense) {
    setActiveOtherExpense(additionalCost);
    setIsDrawerVisible(true);
  }

  const onCloseDrawer = () => {
    setIsDrawerVisible(false);
    setActiveOtherExpense(null);
  };

  const onSubmit = () => {
    if (activeOtherExpense) {
      message.success('Additional expense updated');
    } else {
      message.success('Additional expense created');
    }
    setIsDrawerVisible(false);
    setActiveOtherExpense(null);
    refetch();
  };

  const onConfirmDelete = (id: string) => {
    const reqBody = { projectId, id };

    deleteOtherExpenses.mutate(reqBody, {
      onSuccess: onSuccessDelete
    });
  };

  const onSuccessDelete = () => {
    message.success('Additional expense deleted');
    refetch();
  };

  if (isLoading) {
    return <ContentLoader />;
  }

  return (
    <Container>
      <SectionContainer>
        <SectionTitle>Other cost impacts</SectionTitle>
        {!!data?.otherExpenses?.length && !readOnly && (
          <Button
            onClick={onAddExpense}
            icon={<PlusOutlined />}
            type='primary'
            style={{ paddingRight: '4em', paddingLeft: '4em' }}
          >
            Add cost impact
          </Button>
        )}
      </SectionContainer>
      <Divider />
      {data?.otherExpenses?.length
        ? data.otherExpenses.map(additionalCost => (
            <InfoRow key={additionalCost.id}>
              <Col span={16}>
                <Subtitle>{additionalCost.description}</Subtitle>
                {!readOnly && (
                  <>
                    <a
                      href='#'
                      onClick={e => {
                        onEdit(additionalCost);
                        e.preventDefault();
                      }}
                    >
                      Edit
                    </a>
                    <Typography.Text style={{ opacity: '.25' }}> | </Typography.Text>
                    <Popconfirm
                      title='Are you sure to delete this item?'
                      onConfirm={() => onConfirmDelete(additionalCost.id)}
                      okText='Yes'
                      cancelText='No'
                    >
                      <a href='#'>Delete</a>
                    </Popconfirm>
                  </>
                )}
              </Col>
              <Col span={8}>
                <InfoCard theme='forecast'>
                  <Typography.Title level={5}>Forecast</Typography.Title>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <td>Frequency</td>
                        <td>Annual Total</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{additionalCost.frequency}</td>
                        <td>
                          <CurrencySymbol
                            value={additionalCost.cost * getFrequencyInNumber(additionalCost.frequency)}
                          />
                        </td>
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
                Add cost impact
              </Button>
              <Placeholder>
                You have no additional expense entries yet. Click &apos;+ Add cost impact&apos; above to get started.
              </Placeholder>
            </AddBlock>
          )}
      <Drawer
        title={activeOtherExpense ? 'Update cost impact' : 'Add cost impact'}
        onClose={onCloseDrawer}
        open={isDrawerVisible}
        contentWrapperStyle={contentWrapperStyle}
        destroyOnClose
      >
        <OtherExpensesFormDrawer input={activeOtherExpense} onClose={onSubmit} />
      </Drawer>
    </Container>
  );
};

const getFrequencyInNumber = (name: string) => {
  return OTHER_EXPENSES_FREQUENCIES.find(freq => freq.name.toString() === name)?.annualOccurrence || 1;
};

export default OtherExpenseSection;
