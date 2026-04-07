import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Mapeamento de status para rótulos em português.
const _statusLabels = {
  'pending':     'Pendente',
  'in_progress': 'Em andamento',
  'done':        'Concluído',
  'cancelled':   'Cancelado',
};

/// Cor de fundo dos badges de status.
const _statusColors = {
  'pending':     Color(0xFFfef3c7),
  'in_progress': Color(0xFFdbeafe),
  'done':        Color(0xFFd1fae5),
  'cancelled':   Color(0xFFf3f4f6),
};

/// Cor do texto dos badges de status.
const _statusTextColors = {
  'pending':     Color(0xFF92400e),
  'in_progress': Color(0xFF1e40af),
  'done':        Color(0xFF065f46),
  'cancelled':   Color(0xFF6b7280),
};

/// Define o próximo status no fluxo de progresso da tarefa.
///
/// Somente tarefas pendentes ou em andamento podem avançar.
/// Concluídas e canceladas não possuem próximo passo.
const _nextStatus = {
  'pending':     'in_progress',
  'in_progress': 'done',
};

/// Tela de listagem de tarefas com suporte a atualização de status.
///
/// Exibe cada tarefa em um card com badge de status colorido, cliente
/// responsável e data de vencimento. Tarefas não finalizadas mostram
/// um botão para avançar ao próximo status com confirmação via diálogo.
class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<dynamic> _tasks = [];
  bool _loading = true;

  /// ID da tarefa atualmente sendo atualizada (evita múltiplos cliques simultâneos).
  int? _updating;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Busca a lista de tarefas na API e atualiza o estado local.
  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getTasks();
      setState(() => _tasks = data);
    } catch (_) {
    } finally {
      setState(() => _loading = false);
    }
  }

  /// Avança o status de uma tarefa para o próximo passo do fluxo.
  ///
  /// Exibe um diálogo de confirmação antes de enviar a requisição.
  /// Atualiza o item na lista local com os dados retornados pela API,
  /// evitando um reload completo da lista.
  Future<void> _advance(Map task) async {
    final next = _nextStatus[task['status']];
    if (next == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Atualizar status'),
        content: Text('Mover "${task['title']}" para "${_statusLabels[next]}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a56db), foregroundColor: Colors.white),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _updating = task['id']);
    try {
      final updated = await ApiService.updateTaskStatus(task['id'], next);
      // Atualiza apenas o item modificado sem recarregar toda a lista
      setState(() {
        final idx = _tasks.indexWhere((t) => t['id'] == task['id']);
        if (idx != -1) _tasks[idx] = {...Map<String, dynamic>.from(_tasks[idx]), ...updated};
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _updating = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF1a56db)));

    if (_tasks.isEmpty) {
      return const Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('✅', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text('Nenhuma tarefa', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          SizedBox(height: 6),
          Text('Crie tarefas pelo sistema web.', style: TextStyle(color: Colors.grey)),
        ]),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: const Color(0xFF1a56db),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tasks.length,
        itemBuilder: (_, i) {
          final t = _tasks[i];
          final status = t['status'] as String? ?? 'pending';
          final next = _nextStatus[status];
          final bgColor = _statusColors[status] ?? const Color(0xFFf3f4f6);
          final txtColor = _statusTextColors[status] ?? const Color(0xFF6b7280);

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(t['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      ),
                      const SizedBox(width: 8),
                      // Badge de status com cor semântica
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(999)),
                        child: Text(_statusLabels[status] ?? status,
                          style: TextStyle(color: txtColor, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  if (t['description'] != null && (t['description'] as String).isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(t['description'], style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.person_outline, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(t['client_name'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    if (t['due_date'] != null) ...[
                      const SizedBox(width: 12),
                      const Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(_formatDate(t['due_date']), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ]),
                  if (next != null) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        // Desabilita o botão enquanto a atualização desta tarefa está em andamento
                        onPressed: _updating == t['id'] ? null : () => _advance(t),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF1a56db),
                          side: const BorderSide(color: Color(0xFF1a56db)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: _updating == t['id']
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1a56db)))
                            : Text('→ Mover para ${_statusLabels[next]}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Formata uma data ISO 8601 para o padrão brasileiro (dd/MM/yyyy).
  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}
