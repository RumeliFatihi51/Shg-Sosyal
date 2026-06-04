import 'package:flutter/material.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class EventCreateScreen extends StatelessWidget {
  const EventCreateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Etkinlik öner')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppTextField(label: 'Başlık'),
          const SizedBox(height: 12),
          const AppTextField(label: 'Açıklama', maxLines: 4),
          const SizedBox(height: 12),
          const AppTextField(label: 'Tarih ve saat'),
          const SizedBox(height: 12),
          const AppTextField(label: 'Konum'),
          const SizedBox(height: 20),
          AppButton(label: 'Onaya gönder', expand: true, onPressed: () {}),
        ],
      ),
    );
  }
}
