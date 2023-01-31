import type { UserEventType } from '../tracking';

export type EventProperties = {
  userId: string;
} & Record<string, string>;

type TrackFunction = (event: string, payload: any) => void;

export function sendEvent(track: TrackFunction, eventName: UserEventType, eventProperties: EventProperties) {
  const { userId, ...properties } = eventProperties;
  track(_friendlyEventName(eventName), {
    distinct_id: userId,
    ...paramsToHumanFormat(properties)
  });
}

function _friendlyEventName(eventName: UserEventType) {
  return capitalize(eventName.replace(/_/g, ' '));
}
function capitalize(str: string) {
  return str.toLowerCase().replace(/\w{3,}/g, match => match.replace(/\w/, m => m.toUpperCase()));
}

function paramToHumanFormat(param: string) {
  const paramSpaces = param.replace(/[A-Z]/g, l => ` ${l}`).trim();
  return paramSpaces.charAt(0).toUpperCase() + paramSpaces.slice(1);
}

function paramsToHumanFormat(params: Record<string, any>) {
  const humanReadableParams: Record<string, any> = {};

  Object.keys(params).forEach(k => {
    const updatedKey = paramToHumanFormat(k);
    humanReadableParams[updatedKey] = params[k];
  });

  return humanReadableParams;
}
