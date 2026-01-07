import React from 'react';
import BaseModal from '@/components/organisms/modals/BaseModal';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('BaseModal (branches size/variant)', () => {
  it('renders (invisible) and executes size/variant branches without error', async () => {
    const base = (
      <Text>content</Text>
    );

    const variants: Array<{ variant?: any; size?: any }> = [
      { variant: 'bottom-sheet', size: 'md' },
      { variant: 'center', size: 'sm' },
      { variant: 'center', size: 'md' },
      { variant: 'center', size: 'lg' },
      { variant: 'center', size: 'full' },
      { variant: undefined, size: undefined },
    ];

    for (const cfg of variants) {
      const { toJSON } = await renderWithThemeAsync(
        <BaseModal
          visible={false}
          onClose={() => {}}
          title="T"
          size={cfg.size}
          variant={cfg.variant}
        >
          {base}
        </BaseModal>
      );
      expect(toJSON()).toBeNull();
    }
  });
});
