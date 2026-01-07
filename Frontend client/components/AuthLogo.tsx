/**
 * LOGO D'AUTHENTIFICATION - MOSSOMBI
 * Composant réutilisable pour toutes les pages d'auth
 */

import React from 'react';
import { Image } from 'react-native';

interface AuthLogoProps {
  size?: number;
}

export default function AuthLogo({ size = 120 }: AuthLogoProps) {
  return (
    <Image
      source={require('../assets/images/icon.png')}
      style={{
        width: size,
        height: size,
      }}
      resizeMode="contain"
    />
  );
}
