import React from 'react';
import BookingsExample from '@/components/organisms/BookingsExample';
import { renderWithThemeAsync } from '../test-utils';

describe('BookingsExample', () => {
  it('renders without crashing', async () => {
    const { toJSON } = await renderWithThemeAsync(<BookingsExample />);
    expect(toJSON()).toBeTruthy();
  });
});
