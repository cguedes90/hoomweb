import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

const String _baseUrl = 'https://caring-bravery-production-91ef.up.railway.app/api';
const _storage = FlutterSecureStorage();

class ApiService {
  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _storage.read(key: 'token');
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: await _headers(auth: false),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) throw data['error'] ?? 'Erro ao fazer login';
    await _storage.write(key: 'token', value: data['token']);
    return data;
  }

  static Future<void> logout() async {
    await _storage.delete(key: 'token');
  }

  static Future<String?> getToken() => _storage.read(key: 'token');

  static Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/auth/me'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw 'Sessão expirada';
    return jsonDecode(res.body);
  }

  static Future<List<dynamic>> getClients() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/clients'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw 'Erro ao carregar clientes';
    return jsonDecode(res.body);
  }

  static Future<List<dynamic>> getTasks({String? status, int? clientId}) async {
    final params = <String, String>{};
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (clientId != null) params['client_id'] = clientId.toString();
    final uri = Uri.parse('$_baseUrl/tasks').replace(queryParameters: params.isEmpty ? null : params);
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode != 200) throw 'Erro ao carregar tarefas';
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> updateTaskStatus(int id, String status) async {
    final res = await http.put(
      Uri.parse('$_baseUrl/tasks/$id'),
      headers: await _headers(),
      body: jsonEncode({'status': status}),
    );
    if (res.statusCode != 200) throw 'Erro ao atualizar status';
    return jsonDecode(res.body);
  }
}
