import React from 'react';
import { Text } from 'react-native';
import FormModal from '@/components/organisms/modals/FormModal';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('FormModal', () => {
  it('renders title, children and triggers submit/cancel', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    await renderWithThemeAsync(
      <FormModal
        visible
        onClose={onClose}
        onSubmit={onSubmit}
        title="Nous contacter"
        submitText="Envoyer"
      >
        <Text>Contenu formulaire</Text>
      </FormModal>
    );

    expect(screen.getByText('Nous contacter')).toBeTruthy();
    expect(screen.getByText('Contenu formulaire')).toBeTruthy();

    fireEvent.press(screen.getByText('Envoyer'));
    expect(onSubmit).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Annuler'));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps cancel disabled when loading and does not trigger close', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    await renderWithThemeAsync(
      <FormModal
        visible
        onClose={onClose}
        onSubmit={onSubmit}
        title="Chargement"
        loading
      >
        <Text>Body</Text>
      </FormModal>
    );

    // Cancel should be disabled when loading
    const cancel = screen.getByText('Annuler') as any;
    const findNodeWithProp = (el: any, prop: string): any => {
      let cur = el;
      while (cur) {
        if (cur?.props && prop in cur.props) return cur;
        cur = cur.parent;
      }
      return null;
    };
    const node = findNodeWithProp(cancel, 'accessibilityState');
    expect(node?.props?.accessibilityState?.disabled).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('supports submitLabel alias', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { getByText } = await renderWithThemeAsync(
      <FormModal
        visible
        onClose={onClose}
        onSubmit={onSubmit}
        title="Alias"
        submitLabel="OK"
      >
        <Text>Body</Text>
      </FormModal>
    );

    expect(getByText('OK')).toBeTruthy();
  });
});
