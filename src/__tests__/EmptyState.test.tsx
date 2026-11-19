/**
 * @fileoverview EmptyState: a message above a primary action.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import { EmptyState } from '../components/empty-state/EmptyState';

describe('EmptyState', () => {
  it('shows the message and the action, and reports a press', async () => {
    const onPress = vi.fn();
    const { getByText } = await render(
      <EmptyState
        message='No items found'
        buttonLabel='Create Item'
        onPress={onPress}
      />
    );
    expect(getByText('No items found')).toBeTruthy();
    firePress(getByText('Create Item'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a message alone when given no action', async () => {
    const { getByText, container } = await render(
      <EmptyState message='Nothing here yet' />
    );
    expect(getByText('Nothing here yet')).toBeTruthy();
    expect(container.querySelector('[role="button"]')).toBeNull();
  });
});
