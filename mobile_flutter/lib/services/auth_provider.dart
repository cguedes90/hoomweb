import 'package:flutter/material.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _loading = true;

  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;

  Future<void> checkAuth() async {
    final token = await ApiService.getToken();
    if (token != null) {
      try {
        _user = await ApiService.getMe();
      } catch (_) {
        await ApiService.logout();
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await ApiService.login(email, password);
    _user = data['user'];
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    notifyListeners();
  }
}
