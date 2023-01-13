import Analytics from 'analytics'
import mixpanelPlugin from '@analytics/mixpanel'
import { mixpanelToken } from './config'
import { sendEvent as _sendEvent, EventProperties } from './events'
import { UserEventType } from '../tracking'

const IS_BROWSER = typeof window !== 'undefined'

// Ref: https://www.npmjs.com/package/@analytics/mixpanel
export const analytics = Analytics({
  app: 'chart-reuse',
  plugins: IS_BROWSER
    ? [
        mixpanelPlugin({
          token: mixpanelToken,
          options: {
            debug: process.env.NODE_ENV === 'development',
          },
          pageEvent: 'Page View',
        }),
      ]
    : [],
})
