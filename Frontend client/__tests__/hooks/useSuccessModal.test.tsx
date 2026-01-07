import React from 'react';
import { renderWithThemeAsync } from '../test-utils';
import { useSuccessModal } from '@/hooks/useSuccessModal';
import { act } from '@testing-library/react-native';

function Host({ options, onExpose }: any) {
  const api = useSuccessModal(options);
  React.useEffect(() => {
    onExpose(api);
  }, [api]);
  return null;
}

describe('useSuccessModal', () => {
  it('show/hide toggles visibility and navigateBack/onClose run', async () => {
    const onClose = jest.fn();
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();

    let api: any;
    await renderWithThemeAsync(
      <Host options={{ navigateBack: true, onClose }} onExpose={(v: any) => (api = v)} />
    );

    act(() => {
      api.show({ title: 'OK', message: 'Done', animation: 'confetti' });
    });

    act(() => {
      api.hide();
    });
    expect(onClose).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });
});
