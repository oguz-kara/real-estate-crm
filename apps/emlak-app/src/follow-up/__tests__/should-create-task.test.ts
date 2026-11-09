import { describe, expect, test } from 'vitest';

import { shouldCreateTask } from 'src/follow-up/should-create-task';

describe('shouldCreateTask', () => {
  test('first lapse with no marker → create', () => {
    expect(
      shouldCreateTask({
        nextStatus: 'VADESI_GELDI',
        lastTouchedAt: '2026-10-01T00:00:00Z',
        taskMarker: null,
      }),
    ).toBe(true);
  });

  test('still lapsed, marker newer than the touch → no second task', () => {
    expect(
      shouldCreateTask({
        nextStatus: 'GECIKMIS',
        lastTouchedAt: '2026-10-01T00:00:00Z',
        taskMarker: '2026-10-02T00:00:00Z',
      }),
    ).toBe(false);
  });

  test('new touch after the marker re-arms task creation', () => {
    expect(
      shouldCreateTask({
        nextStatus: 'VADESI_GELDI',
        lastTouchedAt: '2026-10-05T00:00:00Z',
        taskMarker: '2026-10-02T00:00:00Z',
      }),
    ).toBe(true);
  });

  test('never touched with no marker → create', () => {
    expect(
      shouldCreateTask({ nextStatus: 'VADESI_GELDI', lastTouchedAt: null, taskMarker: null }),
    ).toBe(true);
  });

  test('never touched but marker exists → no second task', () => {
    expect(
      shouldCreateTask({
        nextStatus: 'VADESI_GELDI',
        lastTouchedAt: null,
        taskMarker: '2026-10-02T00:00:00Z',
      }),
    ).toBe(false);
  });

  test('healthy or cleared statuses never create', () => {
    expect(
      shouldCreateTask({ nextStatus: 'TAKIPTE', lastTouchedAt: null, taskMarker: null }),
    ).toBe(false);
    expect(shouldCreateTask({ nextStatus: null, lastTouchedAt: null, taskMarker: null })).toBe(false);
  });
});
