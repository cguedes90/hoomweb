import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

/// Ponto de entrada da aplicação.
///
/// Inicializa o [AuthProvider] via [ChangeNotifierProvider] e dispara
/// [AuthProvider.checkAuth] para verificar se já existe um token salvo,
/// evitando que o usuário precise fazer login novamente ao reabrir o app.
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider()..checkAuth(),
      child: const HoomwebApp(),
    ),
  );
}

/// Widget raiz da aplicação.
///
/// Configura o tema global com a cor primária da marca (#1a56db) e
/// delega a decisão de qual tela exibir ao widget [_Root].
class HoomwebApp extends StatelessWidget {
  const HoomwebApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hoomweb',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1a56db)),
        useMaterial3: true,
      ),
      home: const _Root(),
    );
  }
}

/// Widget de roteamento raiz.
///
/// Observa o [AuthProvider] e decide qual tela renderizar:
/// - Enquanto [AuthProvider.loading] for verdadeiro, exibe uma splash screen.
/// - Após a verificação, redireciona para [HomeScreen] (autenticado)
///   ou [LoginScreen] (não autenticado).
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    // Exibe splash enquanto o token está sendo validado no armazenamento seguro
    if (auth.loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF1a56db),
        body: Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('H', style: TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w800)),
            SizedBox(height: 24),
            CircularProgressIndicator(color: Colors.white),
          ]),
        ),
      );
    }

    return auth.isAuthenticated ? const HomeScreen() : const LoginScreen();
  }
}
