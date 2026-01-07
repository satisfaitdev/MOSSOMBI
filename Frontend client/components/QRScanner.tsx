import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export default function QRScanner({
  visible,
  onClose,
  onScan,
  title = 'Scanner le QR Code',
}: QRScannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScan(data);
      setTimeout(() => {
        setScanned(false);
        onClose();
      }, 500);
    }
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
          <View style={[styles.permissionContainer, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.xl }]}>
            <Text style={[styles.permissionTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }]}>
              Permission Caméra
            </Text>
            <Text style={[styles.permissionText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md, marginTop: SPACING.md }]}>
              Nous avons besoin de votre permission pour utiliser la caméra
            </Text>
            <View style={styles.permissionButtons}>
              <Pressable
                onPress={onClose}
                style={[styles.permissionButton, { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md }]}
              >
                <Text style={[styles.buttonText, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md }]}>
                  Annuler
                </Text>
              </Pressable>
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.md }]}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                  Autoriser
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + SPACING.sm }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }]}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: colors.surface,
                borderRadius: BORDER_RADIUS.full,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
            </View>
            <Text style={[styles.instruction, { color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.md }]}>
              Placez le QR code dans le cadre
            </Text>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {},
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    marginTop: SPACING.xl,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  permissionContainer: {
    margin: SPACING.xl,
    padding: SPACING.xl,
  },
  permissionTitle: {
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  permissionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {},
});
