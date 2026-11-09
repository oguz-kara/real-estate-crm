import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
  BUYER_REQUESTS_NAV_ITEM_ID,
} from 'src/constants/request-field-ids';

export default defineNavigationMenuItem({
  universalIdentifier: BUYER_REQUESTS_NAV_ITEM_ID,
  position: 1,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: BUYER_REQUEST_UNIVERSAL_IDENTIFIER,
});
