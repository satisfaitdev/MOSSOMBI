import React, { useState } from 'react';
import SearchBar from '@/components/molecules/SearchBar';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function TestSearch({ suggestions = ['Test', 'Hello'], onSelect }: { suggestions?: string[]; onSelect: (s: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <SearchBar
      value={value}
      onChange={setValue}
      placeholder="Rechercher..."
      suggestions={suggestions}
      onSelectSuggestion={onSelect}
      showSuggestions
    />
  );
}

describe('SearchBar', () => {
  it('shows suggestions on focus and change, and selects a suggestion', async () => {
    const onSelect = jest.fn();
    const utils = await renderWithThemeAsync(<TestSearch onSelect={onSelect} />);
    const input = utils.getByPlaceholderText('Rechercher...');

    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'Tes');

    const item = await utils.findByText('Test');
    // Press closest Pressable ancestor to reliably trigger onPress
    let cur: any = item;
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
    expect(onSelect).toHaveBeenCalledWith('Test');
  });
});
