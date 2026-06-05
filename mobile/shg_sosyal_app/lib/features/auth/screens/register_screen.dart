import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../providers/auth_providers.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _className = TextEditingController();
  final _username = TextEditingController();

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _password.dispose();
    _className.dispose();
    _username.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kayıt ol')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Form(
              key: _formKey,
              child: Column(
                children: [
                  AppTextField(label: 'Ad soyad', controller: _fullName, validator: Validators.required),
                  const SizedBox(height: 12),
                  AppTextField(label: 'E-posta', controller: _email, validator: Validators.email),
                  const SizedBox(height: 12),
                  AppTextField(label: 'Şifre', controller: _password, validator: Validators.password, obscureText: true),
                  const SizedBox(height: 12),
                  AppTextField(label: 'Sınıf', hint: '9/A', controller: _className, validator: Validators.required),
                  const SizedBox(height: 12),
                  AppTextField(label: '@etiket', hint: '@eymen2011', controller: _username, validator: Validators.required),
                  const SizedBox(height: 20),
                  AppButton(
                    label: 'Kayıt ol',
                    expand: true,
                    onPressed: () async {
                      if (!_formKey.currentState!.validate()) return;
                      await ref.read(authControllerProvider.notifier).signUp(
                            fullName: _fullName.text,
                            email: _email.text,
                            password: _password.text,
                            className: _className.text,
                            username: _username.text,
                          );
                      if (!context.mounted) return;
                      final result = ref.read(authControllerProvider);
                      if (result.hasError) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Kayıt oluşturulamadı. Tekrar dene.')),
                        );
                        return;
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Hesabın oluşturuldu.')),
                      );
                      context.go('/profile-setup');
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
