import React from 'react';
import ExclusiveTicketsCarousel from '@/components/organisms/ExclusiveTicketsCarousel';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('ExclusiveTicketsCarousel', () => {
  const events = [
    { id: '1', name: 'E1', description: 'D1', price: 10, date: '2025-11-01', location: 'Paris' },
    { id: '2', name: 'E2', description: 'D2', price: 20, date: '2025-12-01', location: 'Lyon' },
  ];

  it('returns null when no events', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <ExclusiveTicketsCarousel events={[]} onEventPress={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders events and triggers onEventPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ExclusiveTicketsCarousel events={events as any} onEventPress={onPress} />
    );
    // Find nearest Pressable with onPress and press
    const inst: any = utils.root;
    let target: any = null;
    const stack: any[] = [inst];
    while (stack.length) {
      const node = stack.pop();
      if (node?.props && typeof node.props.onPress === 'function') { target = node; break; }
      if (node?.children) stack.push(...node.children);
    }
    expect(target).toBeTruthy();
    fireEvent.press(target);
    expect(onPress).toHaveBeenCalled();
  });
});
