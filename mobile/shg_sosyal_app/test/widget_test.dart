import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shg_sosyal_app/app.dart';

void main() {
  testWidgets('ŞHG Sosyal app opens the main feed', (tester) async {
    await initializeDateFormatting('tr_TR');
    await tester.pumpWidget(const ProviderScope(child: ShgSosyalApp()));
    await tester.pumpAndSettle();

    expect(find.text('Ana Akış'), findsWidgets);
    expect(find.text('Okulda ne paylaşmak istiyorsun?'), findsOneWidget);
  });
}
