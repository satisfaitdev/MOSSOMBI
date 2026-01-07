import React from 'react';
import SelectionGrid from '@/components/molecules/SelectionGrid';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('SelectionGrid', () => {
  const options = [
    { id: '1', name: 'Option A' },
    { id: '2', name: 'Option B', subtitle: 'Sub' },
  ];

  it('selects an option in 2 columns', async () => {
    const onSelect = jest.fn();
    await renderWithThemeAsync(
      <SelectionGrid options={options} selected="Option A" onSelect={onSelect} />
    );
    fireEvent.press(screen.getByText('Option B'));
    expect(onSelect).toHaveBeenCalledWith('Option B');
  });

  it('selects an option in 4 columns', async () => {
    const onSelect = jest.fn();
    await renderWithThemeAsync(
      <SelectionGrid options={options} selected="Option A" onSelect={onSelect} columns={4} />
    );
    fireEvent.press(screen.getByText('Option B'));
    expect(onSelect).toHaveBeenCalledWith('Option B');
  });
});
