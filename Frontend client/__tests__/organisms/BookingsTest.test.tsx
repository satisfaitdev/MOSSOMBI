import React from 'react';
import BookingsTest from '@/components/organisms/BookingsTest';
import { renderWithThemeAsync } from '../test-utils';

describe('BookingsTest', () => {
  it('renders without crashing', async () => {
    const { toJSON } = await renderWithThemeAsync(<BookingsTest />);
    expect(toJSON()).toBeTruthy();
  });
});
