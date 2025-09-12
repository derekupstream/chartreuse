import { Col, Row, Menu, Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { ErrorPage } from 'components/common/errors/ErrorPage';
import { PrintButton } from 'components/common/print/PrintButton';
import { ShareButton } from './components/ShareButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { useGetProjections, useUpdateProjections } from 'client/projects';
import type { ProjectContext } from 'lib/middleware/getProjectContext';

import { useFooterState } from '../components/Footer';
import { Wrapper } from '../styles';

import { LineItemSummary } from './components/LineItemSummary/LineItemSummary';
import { EventProjectSummary } from './components/EventProjectSummary';
import { ProjectSummary } from './components/ProjectSummary/ProjectSummary';
import { isEugeneOrg } from 'lib/featureFlags';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;

export type ProjectionsView = 'summary' | 'single_use_details' | 'reusable_details';

const defaultProjectionsDescription = `These graphs - showing the financial and environmental impacts of reducing single-use items - can help you make the case for reuse and make data driven decisions on how to move forward. You can also print a PDF for sharing and distribution.`;

export const ProjectionsStep = ({ project, readOnly }: { project: ProjectContext['project']; readOnly: boolean }) => {
  const [view, setView] = useState<ProjectionsView>('summary');
  const { data, error, isLoading } = useGetProjections(project.id);
  const { trigger: updateProjections } = useUpdateProjections(project.id);
  const [projectionsDescription, setProjectionsDescription] = useState(project.projectionsDescription);
  const [projectionsTitle, setProjectionsTitle] = useState(project.projectionsTitle);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  function onSelect(e: { key: string }) {
    setView(e.key as ProjectionsView);
  }

  // for printing
  const printRef = useRef(null);

  async function handleProjectionsDescriptionChange(value: string) {
    setProjectionsDescription(value);
    try {
      await updateProjections({ projectionsDescription: value, projectionsTitle: projectionsTitle });
    } catch (error) {
      // revert changes
      setProjectionsDescription(projectionsDescription);
      message.error('Failed to update projections description');
    }
  }

  async function handleProjectionsTitleChange(value: string) {
    setProjectionsTitle(value);
    try {
      await updateProjections({ projectionsDescription: projectionsDescription, projectionsTitle: value });
    } catch (error) {
      // revert changes
      setProjectionsTitle(projectionsTitle);
      message.error('Failed to update projections title');
    }
  }

  const sidebarMenuItems = isEugeneOrg({ id: project.orgId })
    ? [{ key: 'summary', label: 'Summary' }]
    : [
        { key: 'summary', label: 'Summary' },
        { key: 'single_use_details', label: 'Single-use details' },
        { key: 'reusable_details', label: 'Reusable details' }
      ];

  if (isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper>
        <ErrorPage />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={printRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5em' }}
      >
        <Typography.Title
          level={1}
          editable={{
            triggerType: readOnly ? [] : ['icon'], // disables editing for readonly
            onChange: handleProjectionsTitleChange
          }}
        >
          {projectionsTitle || project.name}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <PrintButton printRef={printRef} pdfTitle={`${project.name} - Chart-Reuse`} />
          {!project.isTemplate && <ShareButton projectId={project.id} publicSlug={project.publicSlug} />}
        </div>
      </div>
      <Typography.Title
        level={5}
        style={{ marginTop: 0 }}
        editable={{
          triggerType: readOnly ? [] : ['icon'], // disables editing for readonly
          onChange: handleProjectionsDescriptionChange
        }}
      >
        {projectionsDescription || defaultProjectionsDescription}
      </Typography.Title>
      <br />
      <br />
      <Row gutter={24}>
        <Col span={5} className='dont-print-me'>
          <Menu
            style={{ width: '100%' }}
            selectedKeys={[view]}
            onSelect={onSelect}
            mode={'vertical'}
            items={sidebarMenuItems}
          />
        </Col>
        <StyledCol span={19}>
          <span className={view === 'summary' ? '' : 'print-only'}>
            {project.category === 'event' ? <EventProjectSummary data={data} /> : <ProjectSummary data={data} />}
          </span>
          <div className='page-break' />
          <span className={view === 'single_use_details' ? '' : 'print-only'}>
            <LineItemSummary
              showTitle
              variant='single_use'
              projectCategory={project.category}
              lineItemSummary={data.singleUseResults}
            />
          </span>
          <span className={view === 'reusable_details' ? '' : 'print-only'}>
            <LineItemSummary
              showTitle
              variant='reusable'
              projectCategory={project.category}
              lineItemSummary={data.reusableResults}
            />
          </span>
        </StyledCol>
      </Row>
    </Wrapper>
  );
};
