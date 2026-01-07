import React, { useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { useTypedNavigation } from '@/utils/navigation';

jest.mock('expo-router', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  } as any;
  return {
    useRouter: jest.fn(() => router),
    Href: jest.fn(),
    __router: router,
  };
});

describe('useTypedNavigation', () => {
  const { __router } = jest.requireMock('expo-router');

  function TestComp({ action }: { action: (nav: ReturnType<typeof useTypedNavigation>) => void }) {
    const nav = useTypedNavigation();
    useEffect(() => {
      action(nav);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  }

  it('calls router methods and builds query string in pushWithParams', () => {
    let canBack: boolean | undefined;

    const action = (nav: ReturnType<typeof useTypedNavigation>) => {
      nav.push('/wallet');
      nav.replace('/services');
      nav.back();
      nav.pushWithParams('/wallet', { id: 12, q: 'x y' });
      canBack = nav.canGoBack();
    };

    render(<TestComp action={action} />);

    expect(__router.push).toHaveBeenCalledWith('/wallet');
    expect(__router.replace).toHaveBeenCalledWith('/services');
    expect(__router.back).toHaveBeenCalled();
    expect(__router.push).toHaveBeenCalledWith('/wallet?id=12&q=x+y');
    expect(canBack).toBe(true);
  });
});
