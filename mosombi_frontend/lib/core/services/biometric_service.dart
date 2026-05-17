import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class BiometricService {
  static final LocalAuthentication _auth = LocalAuthentication();

  /// Check if the device supports biometrics AND has enrolled fingerprints/face
  static Future<bool> isSupported() async {
    if (kIsWeb) return false;
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isDeviceSupported = await _auth.isDeviceSupported();
      if (!canCheck || !isDeviceSupported) return false;

      final biometrics = await _auth.getAvailableBiometrics();
      return biometrics.isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  /// Trigger biometric prompt and return result
  static Future<BiometricResult> authenticate() async {
    if (kIsWeb) return BiometricResult.notAvailable;
    try {
      final authenticated = await _auth.authenticate(
        localizedReason: 'Utilisez votre empreinte ou Face ID pour vous connecter à Mossombi',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // allow PIN fallback
          useErrorDialogs: true,
        ),
      );
      return authenticated ? BiometricResult.success : BiometricResult.failure;
    } on PlatformException catch (e) {
      if (e.code == auth_error.notAvailable) return BiometricResult.notAvailable;
      if (e.code == auth_error.notEnrolled) return BiometricResult.notEnrolled;
      if (e.code == auth_error.lockedOut || e.code == auth_error.permanentlyLockedOut) {
        return BiometricResult.lockedOut;
      }
      return BiometricResult.failure;
    }
  }
}

enum BiometricResult { success, failure, notAvailable, notEnrolled, lockedOut }
