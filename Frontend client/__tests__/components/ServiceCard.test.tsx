import React from 'react';
import ServiceCard from '@/components/ServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('ServiceCard', () => {
  it('press triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ServiceCard title="Wifi" icon={<Text>Icon</Text>} onPress={onPress} />
    );
    const node = utils.getByText('Wifi') as any;
    let cur: any = node;
    let pressable: any = null;
    for (let i = 0; i < 6 && cur && !pressable; i++) {
      if (cur?.props && typeof cur.props.onPress === 'function') { pressable = cur; break; }
      cur = cur.parent;
    }
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});
