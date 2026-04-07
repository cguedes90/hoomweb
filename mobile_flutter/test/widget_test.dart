import 'package:flutter_test/flutter_test.dart';
import 'package:hoomweb/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HoomwebApp());
    expect(find.byType(HoomwebApp), findsOneWidget);
  });
}
