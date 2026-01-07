import React from 'react';
import { Text } from 'react-native';
import CategoryCard from '@/components/molecules/CategoryCard';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

const pressParentWithOnPress = (node: any) => {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') {
      fireEvent.press(cur);
      return true;
    }
    cur = cur.parent;
  }
  return false;
};

describe('CategoryCard', () => {
  it('renders name/description and NEW badge', async () => {
    const onPress = jest.fn();
    await renderWithThemeAsync(
      <CategoryCard
        name="Transport"
        description="Services de transport"
        icon={<Text>ICO</Text>}
        isNew
        onPress={onPress}
      />
    );
    expect(screen.getByText('Transport')).toBeTruthy();
    expect(screen.getByText('Services de transport')).toBeTruthy();
    expect(screen.getByText('NOUVEAU')).toBeTruthy();

    // press the card via ancestor with onPress
    const nameNode: any = screen.getByText('Transport');
    expect(pressParentWithOnPress(nameNode)).toBe(true);
  });
});
