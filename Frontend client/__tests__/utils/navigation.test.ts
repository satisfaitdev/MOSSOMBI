import { NavigationService } from '@/utils/navigation';

describe('NavigationService', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs an error if router is not initialized', () => {
    NavigationService.push('/wallet');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('logs an error if back is called when router is not initialized', () => {
    NavigationService.back();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('delegates to router when initialized', () => {
    const router = {
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn(),
      canGoBack: jest.fn(() => true),
    } as any;

    NavigationService.setRouter(router);

    NavigationService.push('/wallet');
    expect(router.push).toHaveBeenCalled();

    NavigationService.back();
    expect(router.back).toHaveBeenCalled();
  });
});
