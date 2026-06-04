import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';

class ProfileSetupScreen extends StatelessWidget {
  const ProfileSetupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profilini tamamla')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const CircleAvatar(radius: 44, child: Icon(Icons.person_add_alt_1)),
          const SizedBox(height: 18),
          const AppTextField(label: 'Bio', hint: 'Kısaca kendinden bahset', maxLines: 3),
          const SizedBox(height: 12),
          const AppTextField(label: 'İlgi alanları', hint: 'Robotik, tiyatro, basketbol'),
          const SizedBox(height: 20),
          AppButton(label: 'Tamamla', expand: true, onPressed: () => context.go('/home')),
        ],
      ),
    );
  }
}
