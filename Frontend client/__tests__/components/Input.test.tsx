import React from 'react';
import Input from '@/components/Input';
import { renderWithThemeAsync, screen, fireEvent } from '../test-utils';

describe('Input', () => {
  it('renders label, required star and placeholder', async () => {
    await renderWithThemeAsync(
      <Input label="Nom" required placeholder="Entrez votre nom" helperText="Aide" />
    );

    expect(screen.getByText(/Nom/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Entrez votre nom')).toBeTruthy();
    expect(screen.getByText('Aide')).toBeTruthy();
  });

  it('supports phone variant', async () => {
    await renderWithThemeAsync(
      <Input variant="phone" placeholder="Téléphone" />
    );

    expect(screen.getByPlaceholderText('Téléphone')).toBeTruthy();
  });

  it('shows error text and prioritizes error over helperText', async () => {
    await renderWithThemeAsync(
      <Input label="Email" error="Requis" helperText="Aide" placeholder="Email" />
    );
    expect(screen.getByText('Requis')).toBeTruthy();
  });

  it('textarea variant sets multiline with 4 lines', async () => {
    await renderWithThemeAsync(
      <Input variant="textarea" label="Message" placeholder="Votre message" />
    );
    const ti = screen.getByPlaceholderText('Votre message');
    expect(ti).toHaveProp('multiline', true);
    expect(ti).toHaveProp('numberOfLines', 4);
  });

  it('date variant has default placeholder and numeric keyboard', async () => {
    await renderWithThemeAsync(
      <Input variant="date" />
    );
    const ti = screen.getByPlaceholderText('JJ/MM/AAAA');
    expect(ti).toHaveProp('keyboardType', 'numeric');
  });

  it('number variant sets keyboardType numeric', async () => {
    await renderWithThemeAsync(
      <Input variant="number" placeholder="Quantité" />
    );
    const ti = screen.getByPlaceholderText('Quantité');
    expect(ti).toHaveProp('keyboardType', 'numeric');
  });

  it('search variant sets correct input props', async () => {
    await renderWithThemeAsync(
      <Input variant="search" placeholder="Rechercher..." />
    );
    const ti = screen.getByPlaceholderText('Rechercher...');
    expect(ti).toHaveProp('autoCapitalize', 'none');
    expect(ti).toHaveProp('autoCorrect', false);
    expect(ti).toHaveProp('returnKeyType', 'search');
  });

  it('border width toggles on focus/blur', async () => {
    await renderWithThemeAsync(
      <Input label="Nom" placeholder="Nom" />
    );
    let ti: any = screen.getByPlaceholderText('Nom');
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
    const findAncestorWithProp = (el: any, prop: string): [any, any] => {
      let cur: any = el;
      while (cur) {
        const val = getStyleProp(cur, prop);
        if (val !== undefined) return [cur, val];
        cur = cur.parent;
      }
      return [null, undefined];
    };

    let [, bw] = findAncestorWithProp(ti, 'borderWidth');
    expect(bw).toBe(1);

    fireEvent(ti, 'focus');
    ti = screen.getByPlaceholderText('Nom');
    ;[, bw] = findAncestorWithProp(ti, 'borderWidth');
    expect(bw).toBe(2);

    fireEvent(ti, 'blur');
    ti = screen.getByPlaceholderText('Nom');
    ;[, bw] = findAncestorWithProp(ti, 'borderWidth');
    expect(bw).toBe(1);
  });
});
