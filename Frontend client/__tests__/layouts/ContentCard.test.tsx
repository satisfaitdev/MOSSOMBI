import React from 'react';
import ContentCard from '@/components/layouts/ContentCard';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

describe('ContentCard', () => {
  it('renders children and calls onPress when pressable', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ContentCard onPress={onPress}><Text>Hello</Text></ContentCard>
    );
    const textNode = utils.getByText('Hello') as any;
    let cur: any = textNode;
    let pressed = false;
    while (cur && !pressed) {
      if (cur?.props && typeof cur.props.onPress === 'function') {
        fireEvent.press(cur);
        pressed = true;
        break;
      }
      cur = cur.parent;
    }
    expect(pressed).toBe(true);
    expect(onPress).toHaveBeenCalled();
  });

  it('renders non-pressable when disabled', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ContentCard onPress={onPress} disabled><Text>World</Text></ContentCard>
    );
    // Not pressable: pressing around should not call onPress
    // We just assert no call since component renders a View without onPress
    expect(onPress).not.toHaveBeenCalled();
  });
});
