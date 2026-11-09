import { SystemPermissionFlag } from 'twenty-sdk/define';
import { describe, expect, test } from 'vitest';

import defaultRole from 'src/default-role';

describe('default function role', () => {
  test('holds the AI permission flag so the intake route can run its agent', () => {
    expect(defaultRole.config.permissionFlagUniversalIdentifiers).toEqual([SystemPermissionFlag.AI]);
  });
});
