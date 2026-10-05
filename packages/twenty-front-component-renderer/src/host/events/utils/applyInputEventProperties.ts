import { isBoolean, isObject, isString } from '@sniptt/guards';

import { MAX_SERIALIZED_EVENT_TEXT_LENGTH } from '@/host/events/constants/MaxSerializedEventTextLength';
import { applyPasteClipboardText } from '@/host/events/utils/applyPasteClipboardText';
import { type SerializedEventData } from '@/types/SerializedEventData';

export const applyInputEventProperties = ({
  serialized,
  domEvent,
}: {
  serialized: SerializedEventData;
  domEvent: Record<string, unknown>;
}): void => {
  const nativeEvent = isObject(domEvent.nativeEvent)
    ? (domEvent.nativeEvent as Record<string, unknown>)
    : domEvent;

  if (isBoolean(nativeEvent.isComposing)) {
    serialized.isComposing = nativeEvent.isComposing;
  }
  if (isString(nativeEvent.inputType)) {
    serialized.inputType = nativeEvent.inputType;
  }
  if (isString(nativeEvent.data)) {
    serialized.data = nativeEvent.data.slice(
      0,
      MAX_SERIALIZED_EVENT_TEXT_LENGTH,
    );
  }

  applyPasteClipboardText(serialized, domEvent);
};
