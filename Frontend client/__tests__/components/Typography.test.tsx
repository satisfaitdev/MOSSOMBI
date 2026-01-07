import React from 'react';
import { Heading, Body, Label, Link, Strong, Muted } from '@/components/atoms/Typography';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('Typography', () => {
  it('renders Heading level 1', async () => {
    await renderWithThemeAsync(<Heading level={1}>Titre 1</Heading>);
    expect(screen.getByText('Titre 1')).toBeTruthy();
  });

  it('renders Heading level 3', async () => {
    await renderWithThemeAsync(<Heading level={3} align="center">Titre 3</Heading>);
    expect(screen.getByText('Titre 3')).toBeTruthy();
  });

  it('renders Body secondary', async () => {
    await renderWithThemeAsync(<Body variant="secondary">Secondaire</Body>);
    expect(screen.getByText('Secondaire')).toBeTruthy();
  });

  it('renders Body tertiary', async () => {
    await renderWithThemeAsync(<Body variant="tertiary">Tertiaire</Body>);
    expect(screen.getByText('Tertiaire')).toBeTruthy();
  });

  it('renders Label with required star', async () => {
    await renderWithThemeAsync(<Label required>Email</Label>);
    expect(screen.getByText(/Email/)).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('renders Link', async () => {
    await renderWithThemeAsync(<Link>Cliquer ici</Link>);
    expect(screen.getByText('Cliquer ici')).toBeTruthy();
  });

  it('renders Strong inside Body', async () => {
    await renderWithThemeAsync(<Body>Texte <Strong>fort</Strong></Body>);
    expect(screen.getByText('fort')).toBeTruthy();
  });

  it('renders Muted', async () => {
    await renderWithThemeAsync(<Muted>Discret</Muted>);
    expect(screen.getByText('Discret')).toBeTruthy();
  });
});
