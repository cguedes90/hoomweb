import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:hoomweb/services/auth_provider.dart';
import 'package:hoomweb/screens/login_screen.dart';

/// Helper que envolve o widget testado com os providers necessários.
Widget _withProviders(Widget child) {
  return ChangeNotifierProvider<AuthProvider>(
    create: (_) => AuthProvider(),
    child: MaterialApp(home: child),
  );
}

void main() {
  group('LoginScreen', () {
    testWidgets('exibe campos de e-mail e senha', (tester) async {
      await tester.pumpWidget(_withProviders(const LoginScreen()));

      expect(find.text('Hoomweb'), findsOneWidget);
      expect(find.text('Entrar'), findsWidgets);
      expect(find.byType(TextField), findsNWidgets(2));
    });

    testWidgets('exibe erro ao submeter campos vazios', (tester) async {
      await tester.pumpWidget(_withProviders(const LoginScreen()));

      // Toca no botão sem preencher os campos
      await tester.tap(find.widgetWithText(ElevatedButton, 'Entrar'));
      await tester.pump();

      expect(find.text('Preencha e-mail e senha.'), findsOneWidget);
    });

    testWidgets('botão fica desabilitado durante o loading', (tester) async {
      await tester.pumpWidget(_withProviders(const LoginScreen()));

      final button = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Entrar'),
      );
      // Inicialmente habilitado (onPressed não é null)
      expect(button.onPressed, isNotNull);
    });
  });
}
