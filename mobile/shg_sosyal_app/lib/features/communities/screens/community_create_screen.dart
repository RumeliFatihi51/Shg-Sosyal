import 'package:flutter/material.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class CommunityCreateScreen extends StatelessWidget {
  const CommunityCreateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Topluluk kur')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppTextField(label: 'Topluluk adı'),
          const SizedBox(height: 12),
          const AppTextField(label: 'Açıklama', maxLines: 4),
          const SizedBox(height: 12),
          const AppTextField(label: 'Kategori'),
          const SizedBox(height: 20),
          AppButton(label: 'Başvuru gönder', expand: true, onPressed: () {}),
        ],
      ),
    );
  }
}
