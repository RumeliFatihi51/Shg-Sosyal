import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _bio = TextEditingController();
  final _interests = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _bio.dispose();
    _interests.dispose();
    super.dispose();
  }

  Future<void> _complete() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    await Future<void>.delayed(const Duration(milliseconds: 360));
    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profilin hazır.')),
    );
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
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
              label: 'Bio',
              hint: 'Kısaca kendinden bahset',
              controller: _bio,
              validator: Validators.required,
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'İlgi alanları',
              hint: 'Robotik, tiyatro, basketbol',
              controller: _interests,
              validator: Validators.required,
            ),
            const SizedBox(height: 20),
            AppButton(
              label: _isSaving ? 'Tamamlanıyor...' : 'Tamamla',
              expand: true,
              onPressed: _isSaving ? null : _complete,
            ),
          ],
        ),
      ),
    );
  }
}
