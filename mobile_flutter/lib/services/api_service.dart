import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// URL base da API de produção.
const String _baseUrl = 'https://caring-bravery-production-91ef.up.railway.app/api';

/// Instância do armazenamento seguro para persistir o token JWT.
///
/// No Android usa EncryptedSharedPreferences; no iOS usa o Keychain.
const _storage = FlutterSecureStorage();

/// Serviço centralizado de comunicação com a API REST do Hoomweb.
///
/// Todos os métodos são estáticos para facilitar o uso em qualquer
/// parte da aplicação sem necessidade de injeção de dependência.
/// O token JWT é lido automaticamente do armazenamento seguro e
/// incluído no header Authorization de cada requisição autenticada.
class ApiService {
  /// Monta os headers HTTP padrão para as requisições.
  ///
  /// Quando [auth] é true (padrão), inclui o token JWT no header
  /// Authorization no formato Bearer. Caso o token não exista,
  /// o header é omitido sem lançar exceção.
  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await _storage.read(key: 'token');
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Autentica o usuário com e-mail e senha.
  ///
  /// Persiste o token JWT retornado no armazenamento seguro do dispositivo.
  /// Lança uma [String] de erro caso as credenciais sejam inválidas ou
  /// o servidor retorne status diferente de 200.
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

  /// Remove o token JWT do armazenamento seguro, encerrando a sessão local.
  static Future<void> logout() async {
    await _storage.delete(key: 'token');
  }

  /// Retorna o token JWT armazenado ou null se não houver sessão ativa.
  static Future<String?> getToken() => _storage.read(key: 'token');

  /// Retorna os dados do usuário autenticado consultando o endpoint /auth/me.
  ///
  /// Usado na inicialização do app para validar se o token salvo ainda é válido.
  /// Lança exceção caso o token esteja expirado (status != 200).
  static Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/auth/me'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw 'Sessão expirada';
    return jsonDecode(res.body);
  }

  /// Retorna a lista de clientes do usuário autenticado.
  static Future<List<dynamic>> getClients() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/clients'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw 'Erro ao carregar clientes';
    return jsonDecode(res.body);
  }

  /// Retorna a lista de tarefas com filtros opcionais de [status] e [clientId].
  ///
  /// Os parâmetros são enviados como query string quando fornecidos.
  static Future<List<dynamic>> getTasks({String? status, int? clientId}) async {
    final params = <String, String>{};
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (clientId != null) params['client_id'] = clientId.toString();
    final uri = Uri.parse('$_baseUrl/tasks').replace(queryParameters: params.isEmpty ? null : params);
    final res = await http.get(uri, headers: await _headers());
    if (res.statusCode != 200) throw 'Erro ao carregar tarefas';
    return jsonDecode(res.body);
  }

  /// Atualiza o status de uma tarefa pelo seu [id].
  ///
  /// Retorna os dados atualizados da tarefa conforme respondido pela API.
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
