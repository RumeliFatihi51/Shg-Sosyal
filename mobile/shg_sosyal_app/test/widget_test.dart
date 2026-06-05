import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shg_sosyal_app/app.dart';
import 'package:shg_sosyal_app/data/mock/mock_users.dart';
import 'package:shg_sosyal_app/data/models/user_model.dart';
import 'package:shg_sosyal_app/features/auth/providers/auth_providers.dart';
import 'package:shg_sosyal_app/features/auth/services/auth_service.dart';

void main() {
  testWidgets('ŞHG Sosyal app opens the main feed', (tester) async {
    await initializeDateFormatting('tr_TR');
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authServiceProvider.overrideWithValue(_TestAuthService()),
        ],
        child: const ShgSosyalApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ana Akış'), findsWidgets);
    expect(find.text('Okulda ne paylaşmak istiyorsun?'), findsOneWidget);
  });
}

class _TestAuthService implements AuthService {
  @override
  Future<UserModel?> currentUser() async => mockCurrentUser;

  @override
  Future<UserModel> signIn({required String email, required String password}) async {
    return mockCurrentUser;
  }

  @override
  Future<UserModel> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  }) async {
    return mockCurrentUser;
  }

  @override
  Future<void> signOut() async {}
}
