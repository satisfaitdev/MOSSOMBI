import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:dio/dio.dart';
import 'package:mosombi_frontend/core/network/api_config.dart';

class GeocodedAddress {
  final double latitude;
  final double longitude;
  final String? city;
  final String? neighborhood;
  final String? street;
  final String? countryCode;
  final String? poi; // Point d'intérêt (ex: Centre de Santé)

  GeocodedAddress({
    required this.latitude,
    required this.longitude,
    this.city,
    this.neighborhood,
    this.street,
    this.countryCode,
    this.poi,
  });
}

class GeocodingService {
  final Dio _dio = Dio();

  /// Récupère la position actuelle avec un timeout
  Future<Position?> getCurrentPosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return null;
      }
      
      if (permission == LocationPermission.deniedForever) return null;

      try {
        return await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 8),
          ),
        ).timeout(const Duration(seconds: 10));
      } catch (e) {
        debugPrint('GeocodingService: Timeout or error in getCurrentPosition, trying last known: $e');
        return await Geolocator.getLastKnownPosition();
      }
    } catch (e) {
      debugPrint('GeocodingService: Error getting position: $e');
      return await Geolocator.getLastKnownPosition();
    }
  }

  /// Géocode des coordonnées en adresse humaine
  Future<GeocodedAddress?> reverseGeocode(double lat, double lng) async {
    // 1. Tentative avec le package geocoding natif
    try {
      final List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng)
          .timeout(const Duration(seconds: 5));
      
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        return GeocodedAddress(
          latitude: lat,
          longitude: lng,
          city: p.locality ?? p.subAdministrativeArea,
          neighborhood: p.subLocality,
          street: p.thoroughfare,
          countryCode: p.isoCountryCode,
        );
      }
    } catch (e) {
      debugPrint('GeocodingService: Native geocoding failed: $e');
    }

    // 2. Fallback avec OSM Nominatim
    try {
      final response = await _dio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'json',
          'lat': lat,
          'lon': lng,
          'addressdetails': 1,
        },
        options: Options(
          headers: {'User-Agent': 'MossombiApp/1.0'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final addr = data['address'] ?? {};
        
        return GeocodedAddress(
          latitude: lat,
          longitude: lng,
          city: addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'],
          neighborhood: addr['suburb'] ?? addr['neighbourhood'] ?? addr['quarter'],
          street: addr['road'],
          countryCode: addr['country_code'],
          poi: data['name'] ?? addr['amenity'] ?? addr['shop'] ?? addr['tourism'] ?? addr['historic'],
        );
      }
    } catch (e) {
      debugPrint('GeocodingService: OSM Fallback failed: $e');
    }

    // 3. Dernier recours : Coordonnées brutes
    return GeocodedAddress(
      latitude: lat,
      longitude: lng,
    );
  }

  /// Matcher une zone via le backend
  Future<Map<String, dynamic>?> matchLogisticsZone(double lat, double lng) async {
    try {
      final response = await _dio.post(
        '${ApiConfig.baseUrl}/logistics-zones/match',
        data: {
          'latitude': lat,
          'longitude': lng,
        },
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'];
      }
    } catch (e) {
      debugPrint('GeocodingService: Backend match failed: $e');
    }
    return null;
  }
}
