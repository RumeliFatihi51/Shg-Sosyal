import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController(text: 'Mehmet Eymen Güler');
  final _bio = TextEditingController(text: 'Robotik, yazılım ve okul etkinlikleri.');
  final _className = TextEditingController(text: '9/A');
  final _interests = TextEditingController(text: 'Robotik, müzik, basketbol');
  bool _isSaving = false;

  @override
  void dispose() {
    _name.dispose();
    _bio.dispose();
    _className.dispose();
    _interests.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    await Future<void>.delayed(const Duration(milliseconds: 360));
    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profil güncellendi.')),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profili düzenle')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
          children: [
            AppTextField(label: 'Ad soyad', controller: _name, validator: Validators.required),
            const SizedBox(height: 12),
            AppTextField(label: 'Bio', controller: _bio, maxLines: 3),
            const SizedBox(height: 12),
            AppTextField(label: 'Sınıf', controller: _className, validator: Validators.required),
            const SizedBox(height: 12),
            AppTextField(label: 'İlgi alanları', controller: _interests),
            const SizedBox(height: 20),
            AppButton(
              label: _isSaving ? 'Kaydediliyor...' : 'Kaydet',
              expand: true,
              onPressed: _isSaving ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
