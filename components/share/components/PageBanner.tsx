import { Col, Typography } from 'antd';
import Image from 'next/legacy/image';
import styled from 'styled-components';

import pageBannerBackgroundSrc from 'public/images/share/pepsi/cups_for_tomorrow.png';

const triangleHeight = 100;

const BannerCard = styled.div`
  position: relative;
  background-color: #0063ef;
  * {
    color: white !important;
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
    fill: #0063ef;
  }
`;

const DesktopElement = styled.div`
  display: none;
  @media (min-width: 900px) {
    display: block;
  }
`;

export function PageBanner() {
  return (
    <BannerCard>
      <BannerCardBackground>
        {/* <svg data-name='Layer 1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'>
          <path d='M649.97 0L550.03 0 599.91 54.12 649.97 0z' className='shape-fill'></path>
        </svg> */}
        <svg width='100%' height='100%' viewBox='0 0 100 102' preserveAspectRatio='none'>
          <path d='M0 0 L50 100 L100 0 Z' className='shape-fill' />
        </svg>
      </BannerCardBackground>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 24
        }}
      >
        <div style={{ maxWidth: 300 }}>
          <Image src={pageBannerBackgroundSrc} alt='' />
        </div>
        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}> */}
        <Typography.Title level={1} style={{ margin: 0, padding: 0, textAlign: 'center' }}>
          Reuse for On-Site Dining
        </Typography.Title>
        <DesktopElement>
          <Typography.Title level={5} style={{ maxWidth: 500, textAlign: 'center' }}>
            The results below are based on data from real businesses that model the environmental impact and economic
            savings of switching to reusables for on-site dining.
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
