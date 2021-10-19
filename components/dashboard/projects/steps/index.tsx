import { useState, useEffect } from "react";
import Step, {
  getStepByIndex,
  getStepIndex,
} from "components/dashboard/projects/Step";
import { Button, Space, Steps } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

import * as S from "components/dashboard/styles";
import { Project } from "@prisma/client";
import { Props } from "components/dashboard";

type ProjectPageProps = Props & {
  project?: Project;
};

const ProjectSteps = ({ user, project }: ProjectPageProps) => {
  const router = useRouter();
  const stepIndexFromQuery = getStepIndex(router?.query?.step as string);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    stepIndexFromQuery > -1 ? stepIndexFromQuery : 0
  );

  useEffect(() => {
    if (router?.query?.step) {
      setCurrentStepIndex(getStepIndex(router?.query?.step as string));
    }
  }, [router?.query?.step]);

  const handleStepComplete = (id?: string) => {
    if (id) {
      router.push(
        `/projects/${id}?step=${getStepByIndex(currentStepIndex + 1)}`
      );
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Button type="text" onClick={() => router.push("/projects")}>
        <ArrowLeftOutlined />
        Back to projects
      </Button>
      <S.Steps current={currentStepIndex}>
        <Steps.Step title="Step 1" description="Setup" />
        <Steps.Step title="Step 2" description="Single-use purchasing" />
        <Steps.Step title="Step 3" description="Reusable purchasing" />
        <Steps.Step title="Step 4" description="Aditional costs" />
        <Steps.Step title="Step 5" description="Saving projections" />
      </S.Steps>
      <Step
        step={getStepByIndex(currentStepIndex)}
        user={user}
        project={project}
        onComplete={handleStepComplete}
      />
    </Space>
  );
};

export default ProjectSteps;
