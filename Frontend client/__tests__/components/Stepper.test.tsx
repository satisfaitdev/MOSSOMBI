import React from 'react';
import Stepper from '@/components/molecules/Stepper';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('Stepper', () => {
  const steps = [
    { id: 0, title: 'Infos' },
    { id: 1, title: 'Paiement' },
    { id: 2, title: 'Confirmation' },
  ];

  it('renders with titles', async () => {
    await renderWithThemeAsync(
      <Stepper steps={steps} currentStep={1} showTitles />
    );
    expect(screen.getByText('Infos')).toBeTruthy();
    expect(screen.getByText('Paiement')).toBeTruthy();
    expect(screen.getByText('Confirmation')).toBeTruthy();
  });

  it('renders without progress bar', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <Stepper steps={steps} currentStep={0} showProgressBar={false} />
    );
    const json = JSON.stringify(toJSON());
    expect(json).not.toContain('height":4');
  });
});
