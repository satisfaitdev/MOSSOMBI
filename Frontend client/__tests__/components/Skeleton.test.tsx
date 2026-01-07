import React from 'react';
import Skeleton from '@/components/atoms/Skeleton';
import { renderWithThemeAsync } from '../test-utils';
import { Animated } from 'react-native';

describe('Skeleton', () => {
  it('renders with default width and height', async () => {
    jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn() } as any);
    const { toJSON } = await renderWithThemeAsync(<Skeleton />);
    const json = JSON.stringify(toJSON());
    // Expect style keys present in JSON tree
    expect(json).toContain('height');
    expect(json).toContain('width');
  });
});
