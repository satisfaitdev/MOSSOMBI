import 'package:flutter_test/flutter_test.dart';
import 'package:mosombi_frontend/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: MossombiApp()));

    // Verify that our initial text is found.
    expect(find.text('Architecture Core Showcase'), findsOneWidget);
  });
}
