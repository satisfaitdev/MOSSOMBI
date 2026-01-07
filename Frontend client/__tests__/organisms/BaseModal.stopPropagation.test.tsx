import React from 'react';
import { Text } from 'react-native';
import BaseModal from '@/components/organisms/modals/BaseModal';
import { renderWithThemeAsync } from '../test-utils';

describe('BaseModal (stopPropagation FNDA:0)', () => {
  it('couvre la fonction anonyme stopPropagation (ligne 166)', async () => {
    const onClose = jest.fn();
    
    const utils: any = await renderWithThemeAsync(
      <BaseModal
        visible={true}
        onClose={onClose}
        title="Test Modal"
        size="md"
        variant="default"
      >
        <Text>Modal Content</Text>
      </BaseModal>
    );

    // Trouver le contenu du modal et déclencher onPress pour couvrir stopPropagation
    const modalContent = utils.getByText('Modal Content') as any;
    
    // Chercher l'ancêtre Pressable qui a la fonction stopPropagation
    let current = modalContent.parent;
    while (current) {
      if (current.props && typeof current.props.onPress === 'function') {
        // Simuler un événement avec stopPropagation
        const mockEvent = {
          stopPropagation: jest.fn(),
          preventDefault: jest.fn(),
        };
        
        // Déclencher onPress avec l'événement mock
        current.props.onPress(mockEvent);
        
        // Vérifier que stopPropagation a été appelé
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        break;
      }
      current = current.parent;
    }
    
    // Le modal ne doit pas se fermer quand on clique sur le contenu
    expect(onClose).not.toHaveBeenCalled();
  });
});
