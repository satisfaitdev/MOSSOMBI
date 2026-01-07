/**
 * POPUP DE CHARGEMENT - MOSSOMBI
 * Popup transparent avec GIF de chargement
 */

import React, { useMemo } from 'react';
import { View, Modal, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';

interface LoadingPopupProps {
  visible: boolean;
}

// Préchargement du GIF pour affichage instantané
const loadingGif = require('../assets/images/loadlogo2.gif');

export default function LoadingPopup({ visible }: LoadingPopupProps) {
  const { colors } = useTheme();

  // Mémorisation des styles pour éviter les re-calculs
  const containerStyle = useMemo(() => ({
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  }), []);

  const popupStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 80,
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }), [colors.card]);

  const imageStyle = useMemo(() => ({
    width: 50,
    height: 50,
  }), []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      {/* Fond transparent optimisé */}
      <View style={containerStyle}>
        {/* Popup de chargement compact */}
        <View style={popupStyle}>
          {/* GIF de chargement optimisé */}
          <Image
            source={loadingGif}
            style={imageStyle}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>
      </View>
    </Modal>
  );
}
