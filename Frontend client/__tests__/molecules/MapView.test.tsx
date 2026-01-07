import React from 'react';
import MapView from '@/components/molecules/MapView';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function findFirstPressableWithOnPress(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (node?.props && typeof node.props.onPress === 'function') return node;
    if (node?.children) stack.push(...node.children);
  }
  return null;
}

describe('MapView', () => {
  const baseProps = {
    coords: { lat: 1, lng: 2 },
    onCoordsChange: jest.fn(),
    address: 'A',
    onAddressChange: jest.fn(),
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    searchResults: [] as any[],
    showSearchResults: false,
    onShowSearchResultsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears search query when pressing clear button', async () => {
    const props = {
      ...baseProps,
      searchQuery: 'abc',
      isSearching: false,
    };

    const utils: any = await renderWithThemeAsync(
      <MapView {...props} />
    );

    const pressable = findFirstPressableWithOnPress(utils.root);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);

    expect(props.onSearchQueryChange).toHaveBeenCalledWith('');
    expect(props.onShowSearchResultsChange).toHaveBeenCalledWith(false);
  });

  it('selects address from results and updates coords/address', async () => {
    const onCoordsChange = jest.fn();
    const onAddressChange = jest.fn();
    const onSearchQueryChange = jest.fn();
    const onShowSearchResultsChange = jest.fn();

    const result = {
      id: 'r1',
      name: 'Place',
      fullAddress: 'Rue X, Ville',
      coords: { lat: 10, lng: 20 },
    };

    const utils: any = await renderWithThemeAsync(
      <MapView
        coords={{ lat: 0, lng: 0 }}
        onCoordsChange={onCoordsChange}
        address={''}
        onAddressChange={onAddressChange}
        searchQuery={'pla'}
        onSearchQueryChange={onSearchQueryChange}
        searchResults={[result]}
        showSearchResults
        onShowSearchResultsChange={onShowSearchResultsChange}
      />
    );

    const pressable = findFirstPressableWithOnPress(utils.root);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);

    expect(onCoordsChange).toHaveBeenCalledWith({ lat: 10, lng: 20 });
    expect(onAddressChange).toHaveBeenCalledWith('Rue X, Ville');
    expect(onSearchQueryChange).toHaveBeenCalledWith('');
    expect(onShowSearchResultsChange).toHaveBeenCalledWith(false);
  });
});
