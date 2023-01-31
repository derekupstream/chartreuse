import mixpanelPlugin from '@analytics/mixpanel';
import Analytics from 'analytics';

import { UserEventType } from '../tracking';

import { mixpanelToken } from './config';
import { sendEvent as _sendEvent, EventProperties } from './events';

const IS_BROWSER = typeof window !== 'undefined';

// Ref: https://www.npmjs.com/package/@analytics/mixpanel
export const analytics = Analytics({
  app: 'chart-reuse',
  plugins: IS_BROWSER
    ? [
        mixpanelPlugin({
          token: mixpanelToken,
          options: {
            debug: process.env.NODE_ENV === 'development'
          },
          pageEvent: 'Page View'
        })
      ]
    : []
});
