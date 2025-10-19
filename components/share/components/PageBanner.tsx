import { BarChartOutlined } from '@ant-design/icons';
import { Col, Typography } from 'antd';
import Image from 'next/legacy/image';
import styled from 'styled-components';
import { CaretDownFilled } from '@ant-design/icons';

import pageBannerBackgroundSrc from 'public/images/share/pepsi/cups_for_tomorrow.png';

const triangleHeight = 100;

const BannerCard = styled.div`
  position: relative;
  // background-color: #0063ef;
  background-color: #034638;
  * {
    // color: white !important;
  }
  margin-bottom: ${triangleHeight}px;
  // overflow: hidden;
  .ant-card-body {
    padding: 0;
  }
  .ant-row {
    flex-flow: row; // this prevents extra height when the left column appears
  }
  .ant-card-body,
  .ant-row {
    height: 100%;
  }
`;

const BannerCardBackground = styled.div`
  position: absolute;
  bottom: -${triangleHeight}px;
  height: ${triangleHeight}px;
  left: 0;
  width: 100%;
  // height: 100%;
  // overflow: hidden;
  // line-height: 0;
  // svg {
  //   position: relative;
  //   display: block;
  //   width: calc(100% + 1.3px);
  //   height: 100%;
  // }

  .shape-fill {
    // fill: #0063ef;
    fill: #034638;
  }
`;

const DesktopElement = styled.div`
  display: none;
  @media (min-width: 900px) {
    display: block;
  }
`;

export function PageBanner({
  title = 'Reuse for On-Site Dining\nCalculator',
  dashboardTitle,
  description = '', //'The results below are based on data from real businesses that model the environmental impact and economic savings of switching to reusables for on-site dining.',
  isProjectTemplate
}: {
  title?: string | null;
  dashboardTitle: string;
  description?: string | null;
  isProjectTemplate?: boolean;
}) {
  return (
    <BannerCard>
      <BannerCardBackground>
        {/* <svg data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'>
          <path d='M649.97 0L550.03 0 599.91 54.12 649.97 0z' className='shape-fill'></path>
        </svg> */}

        <Typography.Paragraph
          style={{
            position: 'absolute',
            top: '2em',
            opacity: 0.8,
            left: 0,
            right: 0,
            fontSize: '1.2em',
            color: 'white',
            textAlign: 'center'
          }}
        >
          CALCULATE YOUR IMPACT
          <br />
          <CaretDownFilled />
        </Typography.Paragraph>
        <svg width='100%' height='100%' viewBox='0 0 100 102' preserveAspectRatio='none'>
          <path d='M0 0 L50 100 L100 0 Z' className='shape-fill' />
        </svg>
      </BannerCardBackground>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 24
        }}
      >
        {/* {isProjectTemplate && ( */}
        <Typography.Paragraph
          style={{
            color: '#9bef52',
            fontSize: '1.4em',
            margin: '2em 0 0',
            lineHeight: '1em',
            display: 'flex',
            gap: '8px',
            alignItems: 'end'
          }}
        >
          <BarChartOutlined style={{ color: '#9bef52', fontSize: '1.2em' }} />
          {dashboardTitle}
        </Typography.Paragraph>
        {/* )} */}
        {/* <div style={{ maxWidth: 300 }}>
          <Image src={pageBannerBackgroundSrc} alt='' />
        </div> */}
        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}> */}
        <Typography.Title
          level={1}
          style={{
            fontSize: '3.5em',
            lineHeight: '1.2em',
            whiteSpace: 'pre-line',
            fontWeight: 500,
            color: 'white',
            margin: 0,
            padding: 0,
            textAlign: 'center'
          }}
        >
          {title}
        </Typography.Title>
        <DesktopElement>
          <Typography.Title
            level={5}
            style={{
              color: 'white',
              maxWidth: 650,
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            {description}
          </Typography.Title>
          {/* <Typography.Title level={5} style={{ margin: 0, padding: 0 }}>
            <ul>
              <li>Significantly reduce the amount of waste being sent to landfill</li>
              <li>Save money by ditching disposable cups</li>
              <li>Improve customer experience with high quality drinkware</li>
              <li>Demonstrate your commitment as a sustainability leader</li>
            </ul>
          </Typography.Title> */}
        </DesktopElement>
        {/* </div> */}
      </div>
    </BannerCard>
  );
}
