import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';

type HookApi = ReturnType<typeof usePublicServiceForm>;

describe('usePublicServiceForm', () => {
  beforeEach(() => {
    // @ts-ignore
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function TestComponent({ onReady, successDuration = 100, onSuccess }: any) {
    const api = usePublicServiceForm({ onSuccess, successDuration });
    const latest = useRef<HookApi>(api);
    latest.current = api;

    useEffect(() => {
      onReady({
        get: () => latest.current,
        submit: api.handleSubmit,
      });
    }, [api, onReady]);

    return null;
  }

  it('validates required fields and shows alert', async () => {
    const expose: any = {};
    const onReady = (x: any) => Object.assign(expose, x);

    render(<TestComponent onReady={onReady} />);
    await act(async () => {});

    const resetForm = jest.fn();
    // No timers or async updates here, submit returns early on validation
    expose.submit({ field1: '' }, resetForm);

    expect(global.alert).toHaveBeenCalledWith('Veuillez remplir tous les champs obligatoires');
    expect(expose.get().loading).toBe(false);
    expect(resetForm).not.toHaveBeenCalled();
  });

  it('handles success flow with timers and calls onSuccess', async () => {
    const expose: any = {};
    const onSuccess = jest.fn();
    const onReady = (x: any) => Object.assign(expose, x);

    render(<TestComponent onReady={onReady} onSuccess={onSuccess} successDuration={100} />);
    await act(async () => {});

    const resetForm = jest.fn();
    jest.useFakeTimers();
    await act(async () => {
      expose.submit({ field1: 'ok' }, resetForm);
    });

    // Loading true immediately
    expect(expose.get().loading).toBe(true);

    // After simulated send (2000ms)
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(expose.get().loading).toBe(false);
    expect(expose.get().successModalVisible).toBe(true);

    // After auto-close (successDuration)
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(expose.get().successModalVisible).toBe(false);
    expect(resetForm).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
