import React from 'react';
import VlogServiceCard from '@/components/VlogServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('VlogServiceCard', () => {
  it('press triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <VlogServiceCard title="Vlog" description="desc" price="500 FCFA" icon={<Text>Icon</Text>} onPress={onPress} />
    );
    const title = utils.getByText('Vlog') as any;
    let cur: any = title;
    let pressable: any = null;
    for (let i = 0; i < 6 && cur && !pressable; i++) {
      if (cur?.props && typeof cur.props.onPress === 'function') { pressable = cur; break; }
      cur = cur.parent;
    }
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});
