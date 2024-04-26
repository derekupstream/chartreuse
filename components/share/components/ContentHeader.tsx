import { ShareAltOutlined } from '@ant-design/icons';
import { Col, Typography } from 'antd';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { PrintButton } from 'components/common/print/PrintButton';

import { HelpIcon } from './HelpIcon';

const mainSectionHeaderHeight = 60;

const DesktopElement = styled.div`
  display: none;
  @media (min-width: 900px) {
    display: block;
  }
`;

export function ContentHeader({
  onClickAssumptions,
  printRef,
  pageTitle
}: {
  onClickAssumptions: VoidFunction;
  printRef: any;
  pageTitle: string;
}) {
  const [absoluteUrl, setAbsoluteUrl] = useState('');
  // capture window URL
  useEffect(() => {
    setAbsoluteUrl(window.location.href);
  }, [setAbsoluteUrl]);
  return (
    <div
      style={{
        height: mainSectionHeaderHeight,
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <Button icon={<HelpIcon />} style={{ color: '#999' }} type='text' onClick={onClickAssumptions}>
        Assumptions / Methodologies
      </Button>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Typography.Text
          copyable={{
            icon: [
              <Button key={0}>
                <ShareAltOutlined /> Share
              </Button>,
              <Button key={1}>
                <ShareAltOutlined /> Copied
              </Button>
            ],
            text: absoluteUrl
          }}
        ></Typography.Text>
        <DesktopElement className='dont-print-me'>
          <PrintButton printRef={printRef} pdfTitle={pageTitle} />
        </DesktopElement>
      </div>
    </div>
  );
}
