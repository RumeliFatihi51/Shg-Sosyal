import 'package:dio/dio.dart';

import '../storage/secure_storage.dart';
import 'api_auth.dart';

class ApiClient {
  ApiClient({
    Dio? dio,
    SecureStorage? storage,
    String baseUrl = const String.fromEnvironment(
      'SHG_API_BASE_URL',
      defaultValue: 'http://localhost:3000/api/mobile',
    ),
  })  : _storage = storage ?? const SecureStorage(),
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: const Duration(seconds: 12),
                receiveTimeout: const Duration(seconds: 20),
                headers: {'Accept': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!options.headers.containsKey('Authorization')) {
            final token = await _storage.read(apiAccessTokenKey);
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
      ),
    );
  }

  final SecureStorage _storage;
  final Dio _dio;

  void setBearerToken(String? token) {
    if (token == null || token.isEmpty) {
      _dio.options.headers.remove('Authorization');
      return;
    }
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response<dynamic>> post(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<dynamic>> put(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<dynamic>> delete(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.delete(path, data: data, queryParameters: queryParameters);
  }
}

String apiErrorMessage(
  Object error, [
  String fallback = 'İşlem tamamlanamadı.',
]) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['error'] != null) return '${data['error']}';
    if (error.message != null && error.message!.isNotEmpty) {
      return error.message!;
    }
  }
  return fallback;
}
