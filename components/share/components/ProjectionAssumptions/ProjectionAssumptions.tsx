import { Typography } from 'antd';

import { LargeSize } from './components/LargeSize';
import { MidSize } from './components/MidSize';
import { SmallSize } from './components/SmallSize';

export function ProjectionAssumptions() {
  return (
    <span className='all-assumptions'>
      <Typography.Title level={1}>Assumptions / Methodologies</Typography.Title>
      <p>
        All assumptions were made with the goal of most accurately reflecting on-site dining reuse systems, utilizing
        the most current available research to supplement Upstream&rsquo;s industry knowledge and past interactions with
        successfully implemented reuse systems. These assumptions are meant to support your business&rsquo;s transition
        to reuse and provide recommendations in areas of uncertainty. Please note all templates are simply projections
        designed to be as widely applicable to businesses as possible, and therefore all variables within these
        assumptions (including pricing, purchasing quantity, equipment, and labor) may be customized to fit your
        businesses current or projected reuse practices.{' '}
      </p>
      <br />
      <br />
      <ul>
        <li>
          <Typography.Title level={3} style={{ padding: 0 }}>
            <a href='#small-size'>Small (150 daily customers) Restaurant</a>
          </Typography.Title>
        </li>
        <li>
          <Typography.Title level={3} style={{ padding: 0 }}>
            <a href='#mid-size'>Mid-sized (400 daily customers) Restaurant</a>
          </Typography.Title>
        </li>
        <li>
          <Typography.Title level={3} style={{ padding: 0 }}>
            {' '}
            <a href='#large-size'>Large (600+ daily customers) Restaurant</a>
          </Typography.Title>
        </li>
      </ul>
      <br />
      <a id='small-size'>
        <Typography.Title level={3}>Small (150 daily customers) Restaurant</Typography.Title>
      </a>
      <span className='smallsize-assumptions'>
        <SmallSize />
      </span>
      <br />
      <br />
      <br />
      <a id='mid-size'>
        <Typography.Title level={3}>Mid-sized (400 daily customers) Restaurant</Typography.Title>
      </a>
      <span className='midsize-assumptions'>
        <MidSize />
      </span>
      <br />
      <br />
      <br />
      <a id='large-size'>
        <Typography.Title level={3}>Large (600+ daily customers) Restaurant</Typography.Title>
      </a>
      <span className='largesize-assumptions'>
        <LargeSize />
      </span>
      <br />
      <br />
      <br />
    </span>
  );
}
