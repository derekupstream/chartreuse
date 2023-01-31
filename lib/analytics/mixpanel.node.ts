import Mixpanel from 'mixpanel';

import type { UserEventType } from '../tracking';

import { mixpanelToken } from './config';
import type { EventProperties } from './events';
import { sendEvent as _sendEvent } from './events';

export type MixpanelProfile = {
  $created: string;
  $name: string;
  Organization: string;
};

const mixpanel = Mixpanel.init(mixpanelToken);

export function sendEvent(eventName: UserEventType, eventProperties: EventProperties) {
  _sendEvent(mixpanel.track, eventName, eventProperties);
}

export function identify(userId: string, profile: MixpanelProfile) {
  mixpanel?.people.set(userId, profile);
}
