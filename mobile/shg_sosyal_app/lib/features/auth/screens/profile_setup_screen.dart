import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../profile/providers/profile_providers.dart';
import '../providers/auth_providers.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _username;
  late final TextEditingController _className;
  final _bio = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).valueOrNull;
    _name = TextEditingController(text: user?.fullName ?? '');
    _username = TextEditingController(text: user?.username ?? '');
    _className = TextEditingController(text: user?.className ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _username.dispose();
    _className.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _complete() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(profileEditControllerProvider.notifier).update(
          fullName: _name.text.trim(),
          username: _username.text.trim(),
          className: _className.text.trim(),
          bio: _bio.text.trim(),
        );
    if (!mounted) return;
    final result = ref.read(profileEditControllerProvider);
    if (result.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(apiErrorMessage(result.error!, 'Profil tamamlanamadı.')),
        ),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profilin hazır.')),
    );
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final saving = ref.watch(profileEditControllerProvider).isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text('Profilini tamamla')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const CircleAvatar(radius: 44, child: Icon(Icons.person_add_alt_1)),
            const SizedBox(height: 18),
            AppTextField(
              label: 'Ad soyad',
              controller: _name,
              validator: Validators.required,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: '@etiket',
              controller: _username,
              validator: Validators.required,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Sınıf',
              hint: '9/A',
              controller: _className,
              validator: Validators.required,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Bio',
              hint: 'Kısaca kendinden bahset',
              controller: _bio,
              validator: Validators.required,
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            AppButton(
              label: saving ? 'Tamamlanıyor...' : 'Tamamla',
              expand: true,
              onPressed: saving ? null : _complete,
            ),
          ],
        ),
      ),
    );
  }
}
