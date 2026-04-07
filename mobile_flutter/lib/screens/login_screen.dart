import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';

/// Tela de autenticação do usuário.
///
/// Apresenta um formulário com campos de e-mail e senha. Ao submeter,
/// delega a autenticação ao [AuthProvider], que persiste o token JWT
/// e notifica a árvore de widgets para redirecionar à [HomeScreen].
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  /// Controla a exibição do indicador de carregamento durante o login.
  bool _loading = false;

  /// Mensagem de erro exibida abaixo do formulário em caso de falha.
  String? _error;

  /// Valida os campos e realiza a chamada de login via [AuthProvider].
  ///
  /// Em caso de erro (credenciais inválidas, falha de rede), exibe a
  /// mensagem retornada pela API. O botão fica desabilitado enquanto
  /// a requisição está em andamento para evitar duplo envio.
  Future<void> _submit() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Preencha e-mail e senha.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await context.read<AuthProvider>().login(_emailCtrl.text.trim(), _passCtrl.text);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a56db),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(51),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text('H', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Hoomweb', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('Sistema de Gestão de Clientes e Tarefas',
                  style: TextStyle(color: Colors.white.withAlpha(204), fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withAlpha(38), blurRadius: 20)],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Entrar', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: _inputDec('E-mail'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passCtrl,
                        obscureText: true,
                        decoration: _inputDec('Senha'),
                        // Permite submeter o formulário pelo teclado (action "done")
                        onSubmitted: (_) => _submit(),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 10),
                        Text(_error!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 13)),
                      ],
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1a56db),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Entrar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Retorna a decoração padrão para os campos de texto do formulário.
  InputDecoration _inputDec(String label) => InputDecoration(
    labelText: label,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
  );
}
