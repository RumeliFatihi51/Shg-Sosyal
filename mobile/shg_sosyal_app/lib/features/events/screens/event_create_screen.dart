import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class EventCreateScreen extends StatefulWidget {
  const EventCreateScreen({super.key});

  @override
  State<EventCreateScreen> createState() => _EventCreateScreenState();
}

class _EventCreateScreenState extends State<EventCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  String _category = 'Atölye';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _location.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 450));
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Etkinlik önerin onaya gönderildi.')),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Etkinlik öner')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 96),
          children: [
            const _FormIntro(
              title: 'Okul takvimine yeni etkinlik ekle',
              body: 'Etkinlikler onaydan sonra okul akışında görünür.',
            ),
            const SizedBox(height: 16),
            AppTextField(label: 'Başlık', controller: _title, validator: Validators.required),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Açıklama',
              controller: _description,
              validator: Validators.required,
              maxLines: 4,
            ),
            const SizedBox(height: 12),
            AppTextField(label: 'Konum', controller: _location, validator: Validators.required),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Kategori'),
              items: const [
                DropdownMenuItem(value: 'Atölye', child: Text('Atölye')),
                DropdownMenuItem(value: 'Spor', child: Text('Spor')),
                DropdownMenuItem(value: 'Sanat', child: Text('Sanat')),
                DropdownMenuItem(value: 'Bilim', child: Text('Bilim')),
                DropdownMenuItem(value: 'Sosyal', child: Text('Sosyal')),
              ],
              onChanged: (value) => setState(() => _category = value ?? _category),
            ),
            const SizedBox(height: 12),
            const AppTextField(label: 'Tarih ve saat', hint: 'Örn. Yarın 15:00'),
            const SizedBox(height: 20),
            AppButton(
              label: _isSubmitting ? 'Gönderiliyor...' : 'Onaya gönder',
              expand: true,
              onPressed: _isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _FormIntro extends StatelessWidget {
  const _FormIntro({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 5),
          Text(body, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
