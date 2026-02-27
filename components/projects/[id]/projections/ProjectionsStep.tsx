import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Row, Menu, Popconfirm, Typography, message } from 'antd';
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
import { SlateEditor } from 'components/common/SlateEditor';
import { Switch } from 'antd';
import Card from './components/common/Card';
import { Divider, SectionHeader, SectionContainer } from './components/common/styles';
import { isEugeneOrg } from 'lib/featureFlags';
import type { InfoPage } from 'lib/infoPages';
import { parseInfoPages, serializeInfoPages, EMPTY_SLATE } from 'lib/infoPages';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;

/* Mobile: horizontal scrollable underline tab bar for view switching */
const MobileViewTabBar = styled.div`
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border-bottom: 2px solid #e8e8e8;
  margin-bottom: 16px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileViewTab = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 10px 16px;
  margin-bottom: -2px;
  border: none;
  border-bottom: 3px solid ${({ $active }) => ($active ? '#95ee49' : 'transparent')};
  background: transparent;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? '#262626' : '#8c8c8c')};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: #262626;
  }
`;

export type ProjectionsView = string;

const defaultProjectionsDescription = `These graphs - showing the financial and environmental impacts of reducing single-use items - can help you make the case for reuse and make data driven decisions on how to move forward. You can also print a PDF for sharing and distribution.`;

export const ProjectionsStep = ({ project, readOnly }: { project: ProjectContext['project']; readOnly: boolean }) => {
  const [view, setView] = useState<string>('summary');
  const { data, error, isLoading } = useGetProjections(project.id);
  const { trigger: updateProjections } = useUpdateProjections(project.id);
  const [projectionsDescription, setProjectionsDescription] = useState(project.projectionsDescription);
  const [projectionsTitle, setProjectionsTitle] = useState(project.projectionsTitle);
  const [infoPages, setInfoPages] = useState<InfoPage[]>(() => parseInfoPages(project.recommendations));

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  function onSelect(e: { key: string }) {
    setView(e.key);
  }

  // for printing
  const printRef = useRef(null);

  async function handleProjectionsDescriptionChange(value: string) {
    setProjectionsDescription(value);
    try {
      await updateProjections({ projectionsDescription: value, projectionsTitle: projectionsTitle });
    } catch (error) {
      setProjectionsDescription(projectionsDescription);
      message.error('Failed to update projections description');
    }
  }

  async function handleProjectionsTitleChange(value: string) {
    setProjectionsTitle(value);
    try {
      await updateProjections({ projectionsDescription: projectionsDescription, projectionsTitle: value });
    } catch (error) {
      setProjectionsTitle(projectionsTitle);
      message.error('Failed to update projections title');
    }
  }

  async function saveInfoPages(pages: InfoPage[]) {
    try {
      await updateProjections({ recommendations: serializeInfoPages(pages) as any });
    } catch {
      message.error('Failed to save changes');
    }
  }

  function updatePageTitle(id: string, title: string) {
    const updated = infoPages.map(p => (p.id === id ? { ...p, title } : p));
    setInfoPages(updated);
    saveInfoPages(updated);
  }

  function updatePageContent(id: string, content: any) {
    const updated = infoPages.map(p => (p.id === id ? { ...p, content } : p));
    setInfoPages(updated);
    saveInfoPages(updated);
  }

  function updatePageShowOnShared(id: string, showOnShared: boolean) {
    const updated = infoPages.map(p => (p.id === id ? { ...p, showOnShared } : p));
    setInfoPages(updated);
    saveInfoPages(updated);
  }

  function addInfoPage() {
    const newPage: InfoPage = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New page',
      content: EMPTY_SLATE,
      showOnShared: true
    };
    const updated = [...infoPages, newPage];
    setInfoPages(updated);
    setView(`info_${newPage.id}`);
    saveInfoPages(updated);
  }

  function deleteInfoPage(id: string) {
    const updated = infoPages.filter(p => p.id !== id);
    setInfoPages(updated);
    if (view === `info_${id}`) {
      setView(updated.length > 0 ? `info_${updated[0].id}` : 'summary');
    }
    saveInfoPages(updated);
  }

  const hideSingleAndReusableDetailsForEugeneOrg = isEugeneOrg({ id: project.orgId });

  const sidebarMenuItems = hideSingleAndReusableDetailsForEugeneOrg
    ? [{ key: 'summary', label: 'Summary' }]
    : [
        { key: 'summary', label: 'Summary' },
        { key: 'single_use_details', label: 'Single-use details' },
        { key: 'reusable_details', label: 'Reusable details' }
      ];

  const infoPageMenuItems = infoPages.map(p => ({ key: `info_${p.id}`, label: p.title || 'Untitled page' }));

  const activeInfoPage = view.startsWith('info_') ? infoPages.find(p => `info_${p.id}` === view) : null;

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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5em',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <Typography.Title
          level={1}
          style={{ fontSize: 'clamp(32px, 6vw, 56px)', marginBottom: 0, lineHeight: 1.1 }}
          editable={{
            triggerType: readOnly ? [] : ['icon'],
            onChange: handleProjectionsTitleChange
          }}
        >
          {projectionsTitle || project.name}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <PrintButton printRef={printRef} pdfTitle={`${project.name} - Chart-Reuse`} />
          {!project.isTemplate && <ShareButton projectId={project.id} publicSlug={project.publicSlug} />}
        </div>
      </div>
      <Typography.Paragraph
        style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: 'rgba(0,0,0,0.55)' }}
        editable={{
          triggerType: readOnly ? [] : ['icon'],
          onChange: handleProjectionsDescriptionChange
        }}
      >
        {projectionsDescription || defaultProjectionsDescription}
      </Typography.Paragraph>
      <MobileViewTabBar>
        {[...sidebarMenuItems, ...infoPageMenuItems].map(item => (
          <MobileViewTab key={item.key} $active={view === item.key} onClick={() => setView(item.key)}>
            {item.label}
          </MobileViewTab>
        ))}
      </MobileViewTabBar>

      <Row gutter={24}>
        <Col xs={0} md={5} className='dont-print-me'>
          <Menu
            style={{ width: '100%', marginBottom: 24 }}
            selectedKeys={[view]}
            onSelect={onSelect}
            mode={'vertical'}
            items={sidebarMenuItems}
          />
          <Menu
            style={{ width: '100%' }}
            selectedKeys={[view]}
            onSelect={onSelect}
            mode={'vertical'}
            items={infoPageMenuItems}
          />
          {!readOnly && (
            <Button type='dashed' icon={<PlusOutlined />} style={{ width: '100%', marginTop: 8 }} onClick={addInfoPage}>
              Add info page
            </Button>
          )}
        </Col>
        <StyledCol xs={24} md={19}>
          <span className={view === 'summary' ? '' : 'print-only'}>
            {project.category === 'event' ? (
              <EventProjectSummary data={data} useShrinkageRate={project.org.useShrinkageRate} />
            ) : (
              <ProjectSummary data={data} />
            )}
          </span>
          {!hideSingleAndReusableDetailsForEugeneOrg && (
            <>
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
            </>
          )}
          {activeInfoPage && (
            <SectionContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Typography.Title
                  level={3}
                  style={{ margin: 0 }}
                  editable={
                    readOnly
                      ? false
                      : {
                          triggerType: ['text', 'icon'],
                          onChange: newTitle => updatePageTitle(activeInfoPage.id, newTitle)
                        }
                  }
                >
                  {activeInfoPage.title || 'Untitled page'}
                </Typography.Title>
                {!readOnly && infoPages.length > 1 && (
                  <Popconfirm
                    title='Delete this page?'
                    onConfirm={() => deleteInfoPage(activeInfoPage.id)}
                    okText='Delete'
                    okButtonProps={{ danger: true }}
                    cancelText='Cancel'
                  >
                    <Button danger size='small'>
                      Delete
                    </Button>
                  </Popconfirm>
                )}
              </div>
              <Divider />
              <Card>
                {!readOnly && (
                  <div style={{ marginBottom: -24, display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        checked={activeInfoPage.showOnShared}
                        onChange={checked => updatePageShowOnShared(activeInfoPage.id, checked)}
                      />
                      <span>Show on shared page</span>
                    </span>
                  </div>
                )}
                <SlateEditor
                  value={activeInfoPage.content}
                  onChange={content => updatePageContent(activeInfoPage.id, content)}
                  readOnly={readOnly}
                />
              </Card>
            </SectionContainer>
          )}
        </StyledCol>
      </Row>
    </Wrapper>
  );
};
