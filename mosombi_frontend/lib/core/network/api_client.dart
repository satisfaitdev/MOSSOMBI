import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class ApiClient {
  final Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  )) {
    _initializeInterceptors();
  }

  void _initializeInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Injecter le token s'il existe
        final token = await _secureStorage.read(key: 'access_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (DioException e, handler) async {
        // Gestion générique des erreurs (ex: 401 Unauthorized -> Logout via un provider ou event bus)
        if (e.response?.statusCode == 401) {
          // TODO: Gérer la déconnexion automatique ou le refresh token ici
          await _secureStorage.delete(key: 'access_token');
        }
        return handler.next(e);
      },
    ));
    
    // (Optionnel) LogInterceptor pour voir les requêtes/réponses dans la console en Dev
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('DioLog: $obj'),
    ));
  }

  Dio get dio => _dio;
}
