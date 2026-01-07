import React from 'react';
import ClassFilters from '@/components/organisms/ClassFilters';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('ClassFilters (coverage)', () => {
  it('couvre onClassChange pour différentes classes et title conditionnel', async () => {
    const onClassChange = jest.fn();
    const classes = [
      { id: 'economy', label: 'Économique', description: 'Confort standard' },
      { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
      { id: 'first', label: 'Première', description: 'Luxe maximum' }
    ];

    const utils: any = await renderWithThemeAsync(
      <ClassFilters
        selectedClass="economy"
        onClassChange={onClassChange}
        classes={classes}
        title="Classe de service"
      />
    );

    // Vérifier que le titre est présent
    expect(utils.getByText('Classe de service')).toBeTruthy();

    // Presser "Affaires"
    const businessText = utils.getByText('Affaires') as any;
    fireEvent.press(findPressableAncestor(businessText));
    expect(onClassChange).toHaveBeenCalledWith('business');

    // Presser "Première"
    const firstText = utils.getByText('Première') as any;
    fireEvent.press(findPressableAncestor(firstText));
    expect(onClassChange).toHaveBeenCalledWith('first');
  });

  it('couvre le cas sans titre', async () => {
    const onClassChange = jest.fn();
    const classes = [
      { id: 'economy', label: 'Économique', description: 'Confort standard' }
    ];

    const utils: any = await renderWithThemeAsync(
      <ClassFilters
        selectedClass="economy"
        onClassChange={onClassChange}
        classes={classes}
        title=""
      />
    );

    // Pas de titre affiché
    expect(() => utils.getByText('Classe de service')).toThrow();
    
    // Mais le composant fonctionne
    const economyText = utils.getByText('Économique') as any;
    fireEvent.press(findPressableAncestor(economyText));
    expect(onClassChange).toHaveBeenCalledWith('economy');
  });
});
