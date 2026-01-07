import React from 'react';
import { Text } from 'react-native';
import BaseModal from '@/components/organisms/modals/BaseModal';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('BaseModal', () => {
  it('renders title, children and footer (center variant)', async () => {
    const onClose = jest.fn();

    await renderWithThemeAsync(
      <BaseModal
        visible
        onClose={onClose}
        title="Mon Titre"
        variant="center"
        size="sm"
        footer={<Text>Le Pied</Text>}
      >
        <Text>Le Contenu</Text>
      </BaseModal>
    );

    expect(screen.getByText('Mon Titre')).toBeTruthy();
    expect(screen.getByText('Le Contenu')).toBeTruthy();
    expect(screen.getByText('Le Pied')).toBeTruthy();
  });

  it('bottom-sheet variant positions at bottom and closes on backdrop when enabled', async () => {
    const onClose = jest.fn();

    await renderWithThemeAsync(
      <BaseModal
        visible
        onClose={onClose}
        title="Sheet"
        variant="bottom-sheet"
      >
        <Text>Body</Text>
      </BaseModal>
    );

    const title = screen.getByText('Sheet') as any;

    const getFlattenedStyles = (el: any) => {
      const style = el?.props?.style;
      const arr = Array.isArray(style) ? style.flat(Infinity) : style ? [style] : [];
      return (arr as any[]).filter(Boolean);
    };
    const getStyleProp = (el: any, prop: string) => {
      const styles = getFlattenedStyles(el);
      for (let i = styles.length - 1; i >= 0; i--) {
        const s = styles[i];
        if (s && typeof s === 'object' && prop in s) return s[prop];
      }
      return undefined;
    };
    const findBackdrop = (el: any) => {
      let cur = el;
      while (cur) {
        const bg = getStyleProp(cur, 'backgroundColor');
        if (bg === 'rgba(0, 0, 0, 0.5)') return cur;
        cur = cur.parent;
      }
      return null;
    };

    const backdrop = findBackdrop(title);
    expect(backdrop).toBeTruthy();
    expect(getStyleProp(backdrop, 'justifyContent')).toBe('flex-end');

    // Backdrop press closes when enabled
    fireEvent.press(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when closeOnBackdrop is false', async () => {
    const onClose = jest.fn();

    await renderWithThemeAsync(
      <BaseModal
        visible
        onClose={onClose}
        title="Sheet2"
        variant="bottom-sheet"
        closeOnBackdrop={false}
      >
        <Text>Body</Text>
      </BaseModal>
    );

    const title = screen.getByText('Sheet2') as any;

    const getFlattenedStyles = (el: any) => {
      const style = el?.props?.style;
      const arr = Array.isArray(style) ? style.flat(Infinity) : style ? [style] : [];
      return (arr as any[]).filter(Boolean);
    };
    const getStyleProp = (el: any, prop: string) => {
      const styles = getFlattenedStyles(el);
      for (let i = styles.length - 1; i >= 0; i--) {
        const s = styles[i];
        if (s && typeof s === 'object' && prop in s) return s[prop];
      }
      return undefined;
    };
    const findBackdrop = (el: any) => {
      let cur = el;
      while (cur) {
        const bg = getStyleProp(cur, 'backgroundColor');
        if (bg === 'rgba(0, 0, 0, 0.5)') return cur;
        cur = cur.parent;
      }
      return null;
    };

    const backdrop = findBackdrop(title);
    expect(backdrop).toBeTruthy();
    fireEvent.press(backdrop);
    expect(onClose).not.toHaveBeenCalled();
  });
});
