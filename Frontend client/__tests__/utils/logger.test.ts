import { logger, measurePerf, Logger } from '@/utils/logger';

describe('logger', () => {
  let logSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs debug/info/warn in dev mode', () => {
    logger.debug('dbg');
    logger.info('inf');
    logger.warn('wrn');

    expect(logSpy).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('always logs error even when disabled', () => {
    const silent = new Logger({ enabled: false });
    silent.error('boom', new Error('x'));
    expect(errorSpy).toHaveBeenCalled();
  });

  it('measurePerf returns value and logs a perf message', () => {
    const result = measurePerf('test-op', () => 42);
    expect(result).toBe(42);
    expect(logSpy).toHaveBeenCalled();
  });

  it('respects minLevel threshold', () => {
    const l = new Logger({ enabled: true, minLevel: 'warn', includeTimestamp: false });
    l.debug('d');
    l.info('i');
    l.warn('w');
    l.error('e', new Error('e'));
    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
