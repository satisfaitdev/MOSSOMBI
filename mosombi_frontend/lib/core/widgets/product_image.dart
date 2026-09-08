import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mosombi_frontend/core/network/api_config.dart';

/// Resolves a product image URL to a fully qualified network URL.
///
/// Handles three cases:
///  1. Full HTTP(S) URL - returned as-is
///  2. Relative path (e.g. /uploads/products/img_xxx.jpeg) - prepended with server base
///  3. Base64 data URI (e.g. data:image/jpeg;base64,...) - returned as-is (use isBase64 to check)
class ProductImageHelper {
  ProductImageHelper._();

  /// Extracts the server origin from the API base URL.
  /// e.g. http://172.20.10.2:3000/api/v1 -> http://172.20.10.2:3000
  static String get _serverBase {
    final base = ApiConfig.baseUrl;
    try {
      final uri = Uri.parse(base);
      return '${uri.scheme}://${uri.host}${uri.port != 80 && uri.port != 443 ? ':${uri.port}' : ''}';
    } catch (_) {
      // Fallback: strip /api/v1 suffix
      return base.replaceAll(RegExp(r'/api/v\d+$'), '');
    }
  }

  /// Returns true if the URL is a base64 data URI.
  static bool isBase64(String url) => url.startsWith('data:image/');

  /// Returns true if the URL is a relative server path (starts with /).
  static bool isRelative(String url) => url.startsWith('/') && !url.startsWith('//');

  /// Resolves a URL to a full network URL.
  /// For base64 strings, returns the original string unchanged.
  static String resolve(String url) {
    if (url.isEmpty) return '';
    if (isBase64(url)) return url;
    if (isRelative(url)) return '$_serverBase$url';
    return url;
  }

  /// Builds the appropriate Image widget for a product image URL.
  /// Supports base64 data URIs, relative server paths, and full URLs.
  static Widget buildImage(
    String url, {
    BoxFit fit = BoxFit.cover,
    double? width,
    double? height,
    Widget? errorWidget,
  }) {
    if (url.isEmpty) {
      return errorWidget ?? _defaultError(width, height);
    }

    // Base64 data URI: decode and display from memory
    if (isBase64(url)) {
      try {
        final base64String = url.replaceFirst(RegExp(r'data:image/[^;]+;base64,'), '');
        return Image.memory(
          base64Decode(base64String),
          fit: fit,
          width: width,
          height: height,
          errorBuilder: (_, __, ___) => errorWidget ?? _defaultError(width, height),
        );
      } catch (_) {
        return errorWidget ?? _defaultError(width, height);
      }
    }

    // Network image (relative or absolute)
    final resolvedUrl = resolve(url);
    return Image.network(
      resolvedUrl,
      fit: fit,
      width: width,
      height: height,
      errorBuilder: (_, __, ___) => errorWidget ?? _defaultError(width, height),
    );
  }

  static Widget _defaultError(double? width, double? height) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[300],
      child: const Center(
        child: Icon(Icons.image_not_supported_rounded, color: Colors.grey, size: 32),
      ),
    );
  }
}
