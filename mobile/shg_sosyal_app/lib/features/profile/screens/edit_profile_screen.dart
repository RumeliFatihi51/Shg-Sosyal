import 'package:flutter/material.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profili düzenle')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const AppTextField(label: 'Ad soyad', hint: 'Mehmet Eymen Güler'),
          const SizedBox(height: 12),
          const AppTextField(label: 'Bio', hint: 'Kısaca kendinden bahset', maxLines: 3),
          const SizedBox(height: 12),
          const AppTextField(label: 'Sınıf', hint: '9/A'),
          const SizedBox(height: 12),
          const AppTextField(label: 'İlgi alanları', hint: 'Robotik, müzik, basketbol'),
          const SizedBox(height: 20),
          AppButton(label: 'Kaydet', expand: true, onPressed: () {}),
        ],
      ),
    );
  }
}
