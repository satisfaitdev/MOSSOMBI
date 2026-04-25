import 'package:flutter/services.dart';
import 'package:injectable/injectable.dart';

@lazySingleton
class NativeEffects {
  static const MethodChannel _channel = MethodChannel('com.mossombi/native_effects');

  Future<void> triggerHaptic(String type) async {
    try {
      await _channel.invokeMethod('triggerHaptic', {'type': type});
    } on PlatformException {
      // Handle native error
    }
  }

  Future<void> showDynamicIslandNotification(String message) async {
    try {
      await _channel.invokeMethod('showDynamicIsland', {'message': message});
    } on PlatformException {
      // Handle native error
    }
  }
}
