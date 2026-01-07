import React from 'react';
import ExclusiveServicesCarousel from '@/components/organisms/ExclusiveServicesCarousel';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('ExclusiveServicesCarousel', () => {
  const services = [
    { id: '1', name: 'S1', coins: 10, price: 5, currency: 'FCFA', category: 'cat' },
    { id: '2', name: 'S2', coins: 20, price: 8, currency: 'FCFA', category: 'cat' },
  ];

  it('returns null when no services', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <ExclusiveServicesCarousel services={[]} onServicePress={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders services and triggers onServicePress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ExclusiveServicesCarousel services={services as any} onServicePress={onPress} />
    );
    // Press nearest Pressable ancestor from any rendered node by traversing tree
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
