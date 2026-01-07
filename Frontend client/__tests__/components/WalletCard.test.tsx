import React from 'react';
import WalletCard from '@/components/WalletCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('WalletCard', () => {
  it('toggle balance visibility and press actions', async () => {
    const onRecharge = jest.fn();
    const onWithdraw = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <WalletCard balance={1000} points={5} onRecharge={onRecharge} onWithdraw={onWithdraw} />
    );

    const toggle = utils.getByTestId('toggle-balance');
    fireEvent.press(toggle);

    const recharge = utils.getByTestId('recharge-button');
    fireEvent.press(recharge);
    expect(onRecharge).toHaveBeenCalled();

    const withdraw = utils.getByTestId('withdraw-button');
    fireEvent.press(withdraw);
    expect(onWithdraw).toHaveBeenCalled();
  });
});
