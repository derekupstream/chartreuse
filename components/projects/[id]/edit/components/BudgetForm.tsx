import type { Project, ProjectCategory } from '@prisma/client';
import { InputNumber, Typography, Slider } from 'antd';
import { Form } from 'antd';
import { Button } from 'antd';
import { useState } from 'react';

export type FormValues = { budget: number | null; singleUseReductionPercentage: number };

type Props = {
  project: Project;
  onComplete: (values: FormValues) => void;
  onSkip: (projectId: string, category: ProjectCategory) => void;
};

export function BudgetForm({ project, onComplete, onSkip }: Props) {
  // disable save button if there are no updates or there are errors
  const [form] = Form.useForm();
  const [disabledSave, setDisabledSave] = useState(true);
  function handleFormChange() {
    const hasErrors = form.getFieldsError().some(({ errors }) => errors.length);
    setDisabledSave(hasErrors);
  }

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={1}>Set up your project budget and single-use reduction targets</Typography.Title>
      </div>
      <Typography.Paragraph>
        Chart-Reuse can help you track your ongoing spending against your annual project budget and track single-use
        targets. You can add or adjust these at any time.
      </Typography.Paragraph>
      <Form
        form={form}
        onFieldsChange={handleFormChange}
        layout='vertical'
        initialValues={{
          budget: project.budget,
          singleUseReductionPercentage: project.singleUseReductionPercentage
        }}
        onFinish={onComplete}
      >
        <Typography.Title level={4}>Project budget</Typography.Title>

        <Form.Item label='What is your projected annual budget for this project?' name='budget'>
          <InputNumber
            prefix='$'
            formatter={value => {
              return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }}
            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Typography.Title level={4}>Single-use reduction target</Typography.Title>

        <Form.Item
          label='What percentage of single-use items would you like to eliminate from your operations this year?'
          name='singleUseReductionPercentage'
        >
          <Slider
            marks={{
              0: '0%',
              25: '25%',
              50: '50%',
              75: '75%',
              100: '100%'
            }}
            min={0}
            max={100}
            style={{ marginTop: 0 }}
          />
        </Form.Item>

        <Form.Item>
          <Button disabled={disabledSave} type='primary' htmlType='submit' block>
            {project ? 'Update project' : 'Complete project setup'}
          </Button>
          <br />
          <br />
          {!project.budget && (
            <Button onClick={() => onSkip(project.id, project.category)} type='text' block>
              <u>skip and complete later</u>
            </Button>
          )}
        </Form.Item>
      </Form>
    </>
  );
}
