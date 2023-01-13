import Mixpanel from 'mixpanel'

import { mixpanelToken } from './config'
import { sendEvent as _sendEvent, EventProperties } from './events'
import { UserEventType } from '../tracking'

export type MixpanelProfile = {
  $created: string
  $name: string
  Organization: string
}

const mixpanel = Mixpanel.init(mixpanelToken)

export function sendEvent(eventName: UserEventType, eventProperties: EventProperties) {
  _sendEvent(mixpanel.track, eventName, eventProperties)
}

export function identify(userId: string, profile: MixpanelProfile) {
  mixpanel?.people.set(userId, profile)
}
