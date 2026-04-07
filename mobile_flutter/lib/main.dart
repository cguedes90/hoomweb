import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider()..checkAuth(),
      child: const HoomwebApp(),
    ),
  );
}

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

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

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
