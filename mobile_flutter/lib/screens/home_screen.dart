import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import 'clients_screen.dart';
import 'tasks_screen.dart';

/// Tela principal pós-autenticação da aplicação.
///
/// Estrutura o layout com [AppBar] e [BottomNavigationBar], alternando
/// entre [ClientsScreen] e [TasksScreen] de acordo com a aba selecionada.
/// Também gerencia o fluxo de logout com diálogo de confirmação.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  /// Índice da aba atualmente selecionada (0 = Clientes, 1 = Tarefas).
  int _index = 0;

  /// Lista de telas indexadas pelo [BottomNavigationBar].
  final _screens = const [ClientsScreen(), TasksScreen()];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a56db),
        foregroundColor: Colors.white,
        title: Text(_index == 0 ? 'Clientes' : 'Tarefas', style: const TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
            onPressed: () async {
              // Exibe diálogo de confirmação antes de encerrar a sessão
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Sair'),
                  content: Text('Encerrar sessão de ${user?['name'] ?? ''}?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a56db), foregroundColor: Colors.white),
                      child: const Text('Sair'),
                    ),
                  ],
                ),
              );
              // Verifica context.mounted antes de usar o context após await
              if (ok == true && context.mounted) {
                context.read<AuthProvider>().logout();
              }
            },
          ),
        ],
      ),
      body: _screens[_index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedItemColor: const Color(0xFF1a56db),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Clientes'),
          BottomNavigationBarItem(icon: Icon(Icons.check_box_outline_blank), activeIcon: Icon(Icons.check_box), label: 'Tarefas'),
        ],
      ),
    );
  }
}
