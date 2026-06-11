import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/profile_providers.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _username;
  late final TextEditingController _bio;
  late final TextEditingController _className;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).valueOrNull;
    _name = TextEditingController(text: user?.fullName ?? '');
    _username = TextEditingController(text: user?.username ?? '');
    _bio = TextEditingController(text: user?.bio ?? '');
    _className = TextEditingController(text: user?.className ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _username.dispose();
    _bio.dispose();
    _className.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(profileEditControllerProvider.notifier).update(
          fullName: _name.text.trim(),
          username: _username.text.trim(),
          bio: _bio.text.trim(),
          className: _className.text.trim(),
        );
    if (!mounted) return;
    final result = ref.read(profileEditControllerProvider);
    if (result.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(apiErrorMessage(result.error!, 'Profil güncellenemedi.')),
        ),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profil güncellendi.')),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final saving = ref.watch(profileEditControllerProvider).isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text('Profili düzenle')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
          children: [
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
            AppTextField(label: 'Bio', controller: _bio, maxLines: 3),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Sınıf',
              controller: _className,
              validator: Validators.required,
            ),
            const SizedBox(height: 20),
            AppButton(
              label: saving ? 'Kaydediliyor...' : 'Kaydet',
              expand: true,
              onPressed: saving ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
