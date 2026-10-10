import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import { PROPERTY_UNIVERSAL_IDENTIFIER } from 'src/constants/property-field-ids';

export default defineNavigationMenuItem({
  universalIdentifier: '970ccd30-d215-4b34-b4a3-6ceafe50ccf1',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PROPERTY_UNIVERSAL_IDENTIFIER,
});
