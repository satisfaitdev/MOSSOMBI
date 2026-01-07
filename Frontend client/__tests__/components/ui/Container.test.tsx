import React from 'react';
import { Section, Box, Stack, Row, Divider, Spacer, Center } from '@/components/ui';
import { Text } from 'react-native';
import { renderWithThemeAsync, screen } from '../../test-utils';

const getStyleProp = (el: any, prop: string) => {
  const styles = Array.isArray(el?.props?.style) ? el.props.style.flat(Infinity) : el?.props?.style ? [el.props.style] : [];
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

describe('UI Container', () => {
  it('Section default renders children', async () => {
    await renderWithThemeAsync(<Section><Text>Contenu</Text></Section>);
    expect(screen.getByText('Contenu')).toBeTruthy();
  });

  it('Section elevated renders', async () => {
    await renderWithThemeAsync(<Section variant="elevated"><Text>Elevé</Text></Section>);
    expect(screen.getByText('Elevé')).toBeTruthy();
  });

  it('Section outlined has border', async () => {
    await renderWithThemeAsync(<Section variant="outlined"><Text>Bord</Text></Section>);
    const node = screen.getByText('Bord') as any;
    const [, bw] = findAncestorWithProp(node, 'borderWidth');
    expect(bw).toBeDefined();
  });

  it('Box supports padding', async () => {
    await renderWithThemeAsync(<Box padding="lg"><Text>Pad</Text></Box>);
    const node = screen.getByText('Pad') as any;
    const [box] = findAncestorWithProp(node, 'padding');
    expect(box).toBeTruthy();
  });

  it('Box supports margin', async () => {
    await renderWithThemeAsync(<Box margin="md"><Text>Mar</Text></Box>);
    const node = screen.getByText('Mar') as any;
    const [box] = findAncestorWithProp(node, 'margin');
    expect(box).toBeTruthy();
  });

  it('Box supports backgroundColor by theme key', async () => {
    await renderWithThemeAsync(<Box backgroundColor="surface"><Text>BG</Text></Box>);
    const node = screen.getByText('BG') as any;
    const [box, bg] = findAncestorWithProp(node, 'backgroundColor');
    expect(box).toBeTruthy();
    expect(bg).toBeDefined();
  });

  it('Box supports borderRadius', async () => {
    await renderWithThemeAsync(<Box borderRadius="lg"><Text>BR</Text></Box>);
    const node = screen.getByText('BR') as any;
    const [, br] = findAncestorWithProp(node, 'borderRadius');
    expect(br).toBeDefined();
  });

  it('Stack vertical by default', async () => {
    await renderWithThemeAsync(<Stack><Center><Text>V</Text></Center></Stack>);
    const node = screen.getByText('V') as any;
    const [, fd] = findAncestorWithProp(node, 'flexDirection');
    expect(fd).toBe('column');
  });

  it('Stack horizontal direction', async () => {
    await renderWithThemeAsync(<Stack direction="horizontal"><Center><Text>H</Text></Center></Stack>);
    const node = screen.getByText('H') as any;
    const [, fd] = findAncestorWithProp(node, 'flexDirection');
    expect(fd).toBe('row');
  });

  it('Stack justify center', async () => {
    await renderWithThemeAsync(<Stack justify="center"><Center><Text>J</Text></Center></Stack>);
    const node = screen.getByText('J') as any;
    const [, jc] = findAncestorWithProp(node, 'justifyContent');
    expect(jc).toBe('center');
  });

  it('Row uses horizontal direction', async () => {
    await renderWithThemeAsync(<Row><Center><Text>R</Text></Center></Row>);
    const node = screen.getByText('R') as any;
    const [, fd] = findAncestorWithProp(node, 'flexDirection');
    expect(fd).toBe('row');
  });

  it('Row justify space-between', async () => {
    // Use Text directly so the nearest ancestor with justifyContent is the Row container (Stack)
    await renderWithThemeAsync(<Row justify="space-between"><Text>RB</Text></Row>);
    const node = screen.getByText('RB') as any;
    const [, jc] = findAncestorWithProp(node, 'justifyContent');
    expect(jc).toBe('space-between');
  });

  it('Divider renders with height 1', async () => {
    const { toJSON } = await renderWithThemeAsync(<Divider />);
    const tree: any = toJSON();
    // Find a node with height 1
    const hasHeightOne = JSON.stringify(tree).includes('"height":1');
    expect(hasHeightOne).toBeTruthy();
  });

  it('Spacer vertical sets height', async () => {
    const { toJSON } = await renderWithThemeAsync(<Spacer size="md" />);
    const tree: any = toJSON();
    expect(JSON.stringify(tree)).toContain('height');
  });

  it('Spacer horizontal sets width', async () => {
    const { toJSON } = await renderWithThemeAsync(<Spacer size="md" direction="horizontal" />);
    const tree: any = toJSON();
    expect(JSON.stringify(tree)).toContain('width');
  });

  it('Center centers content', async () => {
    await renderWithThemeAsync(<Center><Text>Center</Text></Center>);
    const node = screen.getByText('Center') as any;
    const [, ai] = findAncestorWithProp(node, 'alignItems');
    expect(ai).toBe('center');
  });
});
