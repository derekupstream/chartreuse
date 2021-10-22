import { Button, Input, Typography, Slider, message } from "antd";
import { Form, Select } from "antd";
import { Prisma } from "@prisma/client";
import { useMutation } from "react-query";

import * as S from "../styles";
import { StepProps } from "components/dashboard/projects/Step";

const ProjectTypes = [
  "Cafe/Cafeteria",
  "Kitchenette/Employee Breakroom",
  "Event Catering",
  "Special Event (Venue)",
  "Coffee Shop",
  "Fast Casual Restaurant",
  "Food Hall Stand",
  "Other",
] as const;

const WhereFoodIsPrepared = ["On-Site", "Off-Site", "Both"] as const;

export type ProjectMetadata = {
  type: typeof ProjectTypes[number];
  customers: string;
  dineInVsTakeOut: number;
  whereIsFoodPrepared: typeof WhereFoodIsPrepared[number];
};

type ProjectInputFields = ProjectMetadata & {
  name: string;
  accountId: string;
};

type ProjectData = Prisma.ProjectCreateInput & {
  accountId: string;
  orgId: string;
};

type SetupProps = Omit<StepProps, "step">;

const Setup = ({ user, project, onComplete }: SetupProps) => {
  const createProject = useMutation((data: ProjectData) => {
    return fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const updateProject = useMutation((data: ProjectData) => {
    return fetch(`/api/projects/${project?.id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const handleProjectCreation = async ({
    name,
    accountId,
    ...metadata
  }: ProjectInputFields) => {
    createProject.mutate(
      {
        name,
        metadata: metadata as ProjectMetadata,
        accountId,
        orgId: user.org.id,
      },
      {
        onSuccess: async (data: any) => {
          const json = await data.json();
          onComplete(json?.projects?.[0].id);
        },
        onError: (err) => {
          message.error((err as Error)?.message);
        },
      }
    );
  };

  const handleProjectUpdate = async ({
    name,
    accountId,
    ...metadata
  }: ProjectInputFields) => {
    updateProject.mutate(
      {
        name,
        metadata: metadata as ProjectMetadata,
        accountId,
        orgId: user.org.id,
      },
      {
        onSuccess: () => {
          message.success(`Project Updated`);
          onComplete(project?.id);
        },
        onError: (err) => {
          message.error((err as Error)?.message);
        },
      }
    );
  };

  return (
    <S.Wrapper css="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <Typography.Title level={2}>Setup your project</Typography.Title>
      <S.SetupForm
        layout="vertical"
        initialValues={{
          customers: 0,
          dineInVsTakeOut: 0,
          ...(project || {}),
          ...((project?.metadata as {}) || {}),
        }}
        onFinish={
          project
            ? (handleProjectUpdate as (values: unknown) => void)
            : (handleProjectCreation as (values: unknown) => void)
        }
      >
        <Form.Item
          label="Project Name"
          name="name"
          rules={[
            {
              required: true,
              message: "Name is required!",
            },
          ]}
        >
          <Input placeholder="Project Name" />
        </Form.Item>

        <Form.Item
          label="Project Type"
          name="type"
          rules={[
            {
              required: true,
              message: "Type is required!",
            },
          ]}
        >
          <Select placeholder="Project Type">
            {ProjectTypes.map((type) => {
              return (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label="Account"
          name="accountId"
          rules={[
            {
              required: true,
              message: "Account is required!",
            },
          ]}
        >
          <Select placeholder="Account to create project on">
            {user.org.accounts.map((account) => {
              return (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label="On average, how many customers do you serve daily?"
          name="customers"
        >
          <Slider
            marks={{
              50: 50,
              250: 250,
              500: 500,
              1000: "1000+",
            }}
            min={50}
            max={1000}
            step={null}
          />
        </Form.Item>

        <Form.Item
          label="What percent of your daily volume is dine-in vs. take-out?"
          name="dineInVsTakeOut"
        >
          <Slider
            marks={{
              0: "Dine-in",
              100: { style: { width: "100px" }, label: "Take-out" },
            }}
          />
        </Form.Item>

        <Form.Item
          label="Where is the food is primarily prepared?"
          name="whereIsFoodPrepared"
        >
          <S.RadioGroup
            style={{ width: "100%" }}
            options={WhereFoodIsPrepared.map((wfp) => ({
              label: wfp,
              value: wfp,
            }))}
            optionType="button"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {project ? "Update Project" : "Add project"}
          </Button>
        </Form.Item>
      </S.SetupForm>
    </S.Wrapper>
  );
};

export default Setup;
