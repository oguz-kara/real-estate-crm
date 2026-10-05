import { isBoolean, isNumber, isString } from '@sniptt/guards';

import { type SerializedEventData } from '@/types/SerializedEventData';

export const applyKeyboardEventProperties = ({
  serialized,
  domEvent,
}: {
  serialized: SerializedEventData;
  domEvent: Record<string, unknown>;
}): void => {
  if (isString(domEvent.key)) {
    serialized.key = domEvent.key;
  }
  if (isString(domEvent.code)) {
    serialized.code = domEvent.code;
  }
  if (isNumber(domEvent.which)) {
    serialized.which = domEvent.which;
  }
  if (isNumber(domEvent.keyCode)) {
    serialized.keyCode = domEvent.keyCode;
  }
  if (isBoolean(domEvent.repeat)) {
    serialized.repeat = domEvent.repeat;
  }
};
