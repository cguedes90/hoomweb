import 'package:flutter/material.dart';
import 'api_service.dart';

/// Gerenciador de estado de autenticação da aplicação.
///
/// Estende [ChangeNotifier] para notificar widgets dependentes sempre que
/// o estado de autenticação mudar (login, logout, verificação de token).
///
/// Deve ser provido na raiz da árvore de widgets via [ChangeNotifierProvider].
class AuthProvider extends ChangeNotifier {
  /// Dados do usuário autenticado retornados pela API (/auth/me).
  /// Null enquanto não autenticado.
  Map<String, dynamic>? _user;

  /// Indica se a verificação inicial do token ainda está em andamento.
  /// Usado para exibir a splash screen ao iniciar o app.
  bool _loading = true;

  Map<String, dynamic>? get user => _user;

  /// Retorna true se há um usuário autenticado na sessão.
  bool get isAuthenticated => _user != null;

  bool get loading => _loading;

  /// Verifica na inicialização do app se existe um token JWT salvo.
  ///
  /// Caso exista, valida o token consultando o endpoint /auth/me.
  /// Se o token estiver expirado ou inválido, realiza logout automático
  /// para limpar o armazenamento seguro.
  Future<void> checkAuth() async {
    final token = await ApiService.getToken();
    if (token != null) {
      try {
        _user = await ApiService.getMe();
      } catch (_) {
        // Token inválido ou expirado: limpa o armazenamento
        await ApiService.logout();
      }
    }
    _loading = false;
    notifyListeners();
  }

  /// Realiza o login do usuário com e-mail e senha.
  ///
  /// Persiste o token JWT retornado via [ApiService.login] e armazena
  /// os dados do usuário em [_user], notificando os widgets dependentes.
  Future<void> login(String email, String password) async {
    final data = await ApiService.login(email, password);
    _user = data['user'];
    notifyListeners();
  }

  /// Encerra a sessão do usuário.
  ///
  /// Remove o token do armazenamento seguro e limpa [_user],
  /// redirecionando automaticamente para a tela de login via [_Root].
  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    notifyListeners();
  }
}
