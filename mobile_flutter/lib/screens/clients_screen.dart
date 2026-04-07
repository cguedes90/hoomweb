import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});
  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  List<dynamic> _clients = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.getClients();
      setState(() => _clients = data);
    } catch (_) {
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF1a56db)));

    if (_clients.isEmpty) {
      return const Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('👥', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text('Nenhum cliente', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          SizedBox(height: 6),
          Text('Cadastre clientes pelo sistema web.', style: TextStyle(color: Colors.grey)),
        ]),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: const Color(0xFF1a56db),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _clients.length,
        itemBuilder: (_, i) {
          final c = _clients[i];
          final initial = (c['name'] as String).isNotEmpty ? (c['name'] as String)[0].toUpperCase() : '?';
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
            child: ListTile(
              contentPadding: const EdgeInsets.all(12),
              leading: CircleAvatar(
                backgroundColor: const Color(0xFFdbeafe),
                child: Text(initial, style: const TextStyle(color: Color(0xFF1a56db), fontWeight: FontWeight.w700, fontSize: 18)),
              ),
              title: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (c['email'] != null) Text(c['email'], style: const TextStyle(fontSize: 13)),
                  if (c['phone'] != null) Text(c['phone'], style: const TextStyle(fontSize: 13)),
                  if (c['city'] != null)
                    Text('📍 ${c['city']}${c['state'] != null ? '/${c['state']}' : ''}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
