import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../providers/auth_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController(text: 'mr.eymen2011@gmail.com');
  final _password = TextEditingController(text: '123456');

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(AppConstants.appName, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(AppConstants.appTagline, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 28),
                AppTextField(
                  label: 'E-posta',
                  controller: _email,
                  validator: Validators.email,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Şifre',
                  controller: _password,
                  validator: Validators.password,
                  obscureText: true,
                ),
                const SizedBox(height: 20),
                AppButton(
                  label: auth.isLoading ? 'Giriş yapılıyor...' : 'Giriş yap',
                  expand: true,
                  onPressed: auth.isLoading
                      ? null
                      : () async {
                          if (!_formKey.currentState!.validate()) return;
                          await ref
                              .read(authControllerProvider.notifier)
                              .signIn(_email.text, _password.text);
                          if (!context.mounted) return;
                          final result = ref.read(authControllerProvider);
                          if (result.hasError) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Giriş yapılamadı. Bilgilerini kontrol et.')),
                            );
                            return;
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Tekrar hoş geldin.')),
                          );
                          context.go('/home');
                        },
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => context.go('/register'),
                  child: const Text('Hesabın yok mu? Kayıt ol'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
